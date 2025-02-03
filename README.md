# aqt-fix-port

## Build Setup

```bash
# ติดตั้ง dependencies
$ npm install

# เปิด frontend (nuxt) พร้อม backend (node server.js)
$ npm run server

# การตั้งค่า Python Virtual Environment (.venv)
    # 1.สร้าง Virtual Environment ใช้คำสั่งนี้ในการสร้าง Virtual Environment
    $ python -m venv .venv
    # 2.เปิดใช้งาน Virtual Environment
        # Windows 
            $ .venv\Scripts\activate
        # macOS/Linux
            $ source .venv/bin/activate
    # 3. ติดตั้ง dependencies เมื่อเปิดใช้งาน Virtual Environment แล้ว ติดตั้ง dependencies ทั้งหมดจากไฟล์ requirements.txt
    $ pip install -r requirements.txt
    # 4.ปิดใช้งาน Virtual Environment เมื่อเสร็จสิ้นการใช้งาน ให้ปิด Virtual Environment ด้วยคำสั่ง
    $ deactivate
```

สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับการทำงาน โปรดดู [documentation](https://nuxtjs.org).

## โฟลเดอร์พิเศษ (Special Directories)

คุณสามารถสร้างโฟลเดอร์เพิ่มเติมต่อไปนี้ได้ ซึ่งบางโฟลเดอร์มีพฤติกรรมพิเศษ โฟลเดอร์ pages เป็นโฟลเดอร์เดียวที่จำเป็น ส่วนโฟลเดอร์อื่นๆ สามารถลบได้หากคุณไม่ต้องการใช้งาน

### `assets`

โฟลเดอร์นี้เก็บไฟล์ assets ที่ยังไม่ได้คอมไพล์ เช่น ไฟล์ Stylus หรือ Sass, รูปภาพ และฟอนต์
ดูข้อมูลเพิ่มเติมเกี่ยวกับการใช้งาน ที่นี่ [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/assets).

### `components`

โฟลเดอร์นี้เก็บ Vue.js components ของคุณ ซึ่งสามารถนำไปใช้ซ้ำในหน้า, layouts หรือ components อื่นๆ
ดูข้อมูลเพิ่มเติมเกี่ยวกับการใช้งาน ที่นี่ [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/components).

### `layouts`

Layouts ช่วยเปลี่ยนแปลงลักษณะของแอป Nuxt เช่น การเพิ่ม sidebar หรือสร้าง layout ที่ต่างกันสำหรับอุปกรณ์มือถือและเดสก์ท็อป
ดูข้อมูลเพิ่มเติมเกี่ยวกับการใช้งาน ที่นี่ [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/layouts).


### `pages`

โฟลเดอร์นี้เก็บ views และ routes ของแอปพลิเคชัน Nuxt ทุกไฟล์ .vue ในโฟลเดอร์นี้จะถูกตั้งค่าด้วย Vue Router อัตโนมัติ
ดูข้อมูลเพิ่มเติมเกี่ยวกับการใช้งาน ที่นี่ [the documentation](https://nuxtjs.org/docs/2.x/get-started/routing).

### `plugins`

โฟลเดอร์นี้เก็บ JavaScript plugins ที่ต้องการให้ทำงานก่อน root Vue.js Application นี่คือที่สำหรับเพิ่ม Vue plugins หรือ inject ฟังก์ชันและคอนสแตนต์ต่างๆ
ดูข้อมูลเพิ่มเติมเกี่ยวกับการใช้งาน ที่นี่ [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/plugins).

### `static`

โฟลเดอร์นี้เก็บไฟล์ static ทุกไฟล์ในโฟลเดอร์นี้จะถูกแมปไปยัง /
ตัวอย่าง: /static/robots.txt จะถูกแมปเป็น /robots.txt
ดูข้อมูลเพิ่มเติมเกี่ยวกับการใช้งาน ที่นี่ [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/static).

### `store`

โฟลเดอร์นี้เก็บไฟล์ Vuex store การสร้างไฟล์ในโฟลเดอร์นี้จะเปิดใช้งาน Vuex โดยอัตโนมัติ
ดูข้อมูลเพิ่มเติมเกี่ยวกับการใช้งาน ที่นี่ [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/store).
