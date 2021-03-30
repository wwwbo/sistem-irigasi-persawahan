# import library yang dibutuhkan
import RPi.GPIO as GPIO
import time
import spidev
import datetime
import mysql.connector
from numpy import interp
from datetime import datetime

# membuat koneksi ke database mysql
db = mysql.connector.connect(
    host="localhost",
    user="root",
    passwd="root",
    db="irigasi"
)

# mengecek koneksi ke database
if db.is_connected():
    print("Berhasil terhubung ke database")

cursor = db.cursor()

now = datetime.now()

# membuka spi koneksi
spi = spidev.SpiDev()
spi.open(0,0)

# set GPIO 
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

# set pin yang dipakai untuk sensor ultarasonic
TRIG = 24
ECHO = 23

# set input/output pin GPIO
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)
GPIO.output(TRIG, False)

print("Mendeteksi Keberadaan Air ...")
print("="*30)
time.sleep(3)
print("Tunggu Sebentar yaa ..")
print("="*30)
time.sleep(3)

# membuat fungsi untuk membaca ketinggian air
def water():
    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)
    
    pulse_start = time.time()
    pulse_stop  = time.time()

    while GPIO.input(ECHO)==0:
        pulse_start = time.time()

    while GPIO.input(ECHO)==1:
        pulse_stop = time.time()

    pulse_time = pulse_stop - pulse_start
    outputWater = (pulse_time * 34300) / 2
    outputWater = interp(outputWater, [0, 10], [10, 0])
    outputWater = int(round(outputWater))
    return outputWater

# set spi untuk analog input
def analogInput(channel):
    spi.max_speed_hz = 1350000
    adc = spi.xfer2([1,(8+channel)<<4,0])
    data = ((adc[1]&3)<< 8)+adc[2]
    return data

# fungsi untuk membaca kelembaban tanah
def soil():
    outputSoil = analogInput(0) # membaca adc ke 1 = CH0
    outputSoil = interp(outputSoil, [0, 1023], [100,0])
    outputSoil = int(outputSoil)
    return outputSoil

# fungsi untuk mengihitung dan memberikan status untuk keterangan sawah
def hitung():
    outputWater = water()
    
    ketinggianAir = 10
    
    kekuranganAir = ketinggianAir - outputWater
    
    if outputWater == 10:
        grade = "Matikan pompa sekarang!"
    elif outputWater >= 8:
        grade = "Kurangi air, pengairan lebih dari stabil"
    elif outputWater >= 6:
        grade = "Pengairan cukup baik"
    elif outputWater >= 3:
        grade = "Pengairan stabil"
    elif outputWater == 1:
        grade = "Lakukan penyiraman!"
    else:
        grade = "Lakukan penyiraman!"
        
    grade = grade
    
    # set waktu
    d = 60 # 1 detik = 60 second
    m = 60 # 1 menit = 60 detik
    h = 60 # 1 jam = 60 menit
    
    # menghitung waktu pompa menyala/hidup  
    count1 = int(round((kekuranganAir * d) / m) * 100) # dikalikan 100 karena luas sawah 10*10 m2
    count2 = int(round(count1 / h))
    
    return count1, count2, grade

# membuat fungsi untuk memasukan data kedalam database
def logData(outputWater, outputSoil, count2, grade):
    formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
    tanggal = now.strftime('%Y-%m-%d')
    waktu = now.strftime('%H:%M:%S')

    sql = "INSERT INTO temp(ketinggian, kelembaban, keterangan, waktu_pompa, tanggal_waktu, tanggal, waktu) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    val = (outputWater, outputSoil, grade, count2, formatted_date, tanggal, waktu)
    
    cursor.execute(sql, val)
    
    db.commit()
    
# membuat fungsi main yang menjalankan semua fungsi
def main():
    while True:
        outputWater = water()
        outputSoil = soil()
        count1, count2, grade = hitung()
        logData(outputWater, outputSoil, count2, grade)
        print("Ketinggian Air: ", outputWater, "Cm")
        print("Kelembaban Tanah: ", outputSoil, "%")
        print("Status: ", grade)
        print("="*30)   
        time.sleep(10)
        
# memanggil fungsi main()
if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n")
        print("Program telah berhenti")
        GPIO.cleanup()