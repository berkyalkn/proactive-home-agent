print("🚀 Script başlatılıyor... (Eğer bunu görüyorsan Python çalışıyor)")

from sqlmodel import SQLModel, Session, select
from database.settings import engine
from database.models import Room, Device

def init_db():
    print("⏳ Veritabanı bağlantısı deneniyor ve tablolar oluşturuluyor...")
    
    try:
        # Tabloları oluştur
        SQLModel.metadata.create_all(engine)
        print("✅ Tablolar başarıyla oluşturuldu (veya zaten vardı).")
    except Exception as e:
        print(f"❌ KRİTİK HATA (Tablo Oluşturma): {e}")
        return

    # Örnek Verileri Ekle
    try:
        with Session(engine) as session:
            # 1. Odaları Kontrol Et / Ekle
            rooms = ["Living Room", "Guest Room", "Bedroom"]
            for room_name in rooms:
                statement = select(Room).where(Room.name == room_name)
                results = session.exec(statement)
                if not results.first():
                    room = Room(name=room_name)
                    session.add(room)
                    print(f"➕ Oda eklendi: {room_name}")
            
            # 2. Örnek Cihaz Ekle
            statement = select(Device).where(Device.name == "ESP32_Main")
            if not session.exec(statement).first():
                # Önce Living Room'u bulalım
                living_room = session.exec(select(Room).where(Room.name == "Living Room")).first()
                if living_room:
                    dev = Device(
                        name="ESP32_Main", 
                        device_type="sensor_node", 
                        room_id=living_room.id
                    )
                    session.add(dev)
                    print("➕ Cihaz eklendi: ESP32_Main")
            
            session.commit()
            print("💾 Tüm veriler kaydedildi.")

    except Exception as e:
        print(f"❌ HATA (Veri Ekleme): {e}")

if __name__ == "__main__":
    init_db()