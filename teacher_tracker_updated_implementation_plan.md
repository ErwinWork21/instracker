# Teacher Tracker Web App --- Updated Implementation Plan

## 1. Overview

Teacher Tracker adalah simple web-based application untuk membantu
teacher mengelola:

-   Student
-   Program
-   Foundation
-   Term
-   Lesson
-   Attendance
-   Progress Update
-   Video Editing
-   Teacher's Note

Prinsip utama:

-   Simple dan cepat digunakan saat mengajar.
-   Single main dashboard untuk workflow utama.
-   Semua student dapat dicari dan difilter.
-   Attendance menggunakan checklist sederhana.
-   Lesson 1--8 bukan sistem urutan.
-   Lesson 9 dan 10 baru terbuka setelah total 8 attendance/pertemuan
    tercapai.
-   Progress Update dan Video Editing memiliki status masing-masing.
-   Teacher's Note disimpan sebagai history dan tidak overwrite note
    sebelumnya.
-   Semua perubahan penting memiliki timestamp berupa tanggal + jam
    sampai menit.
-   Database menggunakan Supabase PostgreSQL.
-   Frontend menggunakan ReactJS.
-   Aplikasi dapat dikembangkan secara lokal dan kemudian di-deploy ke
    Vercel.

------------------------------------------------------------------------

# 2. Technology Stack

## Frontend

-   ReactJS
-   React-based web application
-   Supabase JavaScript client untuk akses database

## Database / Backend Service

-   Supabase
-   PostgreSQL

## Deployment

-   Vercel

Arsitektur sederhana:

``` text
ReactJS
   |
   | Supabase Client
   v
Supabase
   |
   +-- PostgreSQL Database
```

Tidak perlu membuat backend server terpisah untuk MVP kecuali nanti
memang diperlukan.

------------------------------------------------------------------------

# 3. Academic Structure

Ada dua program:

-   Kinder
-   Junior

Foundation dan Term adalah dua informasi akademik yang terpisah.

## Foundation

-   Foundation 1
-   Foundation 2

## Term

-   Term 1
-   Term 2
-   Term 3
-   Term 4

Foundation bukan parent dari Term.

Contoh:

``` text
Joshua
Program: Kinder
Foundation: Foundation 1
Current Term: Term 2
```

Struktur:

``` text
Student
├── Program
├── Foundation
└── Active Term
```

Student dapat memiliki riwayat beberapa term.

------------------------------------------------------------------------

# 4. Student

Minimal data student:

``` text
Student
- id
- name
- program
- foundation
- active_term_id
- created_at
- updated_at
```

Contoh:

``` text
Joshua
Kinder
Foundation 1
Current Term: Term 2
```

Ketika student berpindah term, term sebelumnya tetap disimpan sebagai
history.

------------------------------------------------------------------------

# 5. Term

Setiap student dapat memiliki beberapa term.

Data minimal:

``` text
Term
- id
- student_id
- term_number
- status
- created_at
- updated_at
- completed_at
```

Status:

``` text
On Progress
Completed
```

Setiap term memiliki 10 lesson slots.

------------------------------------------------------------------------

# 6. Lesson

Setiap term memiliki:

``` text
Lesson 1
Lesson 2
Lesson 3
Lesson 4
Lesson 5
Lesson 6
Lesson 7
Lesson 8
Lesson 9
Lesson 10
```

Data lesson:

``` text
Lesson
- id
- term_id
- lesson_number
- attendance
- attendance_at
- created_at
- updated_at
```

## Important Attendance Rule

Lesson 1--8 TIDAK sequential dan TIDAK dikunci.

Teacher bebas melakukan attendance pada Lesson 1--8 sesuai pertemuan
yang terjadi.

Contoh:

``` text
Lesson 1  ✓
Lesson 2  ✓
Lesson 3  ☐
Lesson 4  ✓
Lesson 5  ☐
Lesson 6  ✓
Lesson 7  ✓
Lesson 8  ✓
```

Yang menjadi syarat hanya jumlah attendance.

Jika total attendance yang sudah checked mencapai 8:

``` text
Total Attendance = 8
```

maka:

``` text
Lesson 9 = Unlocked
Lesson 10 = Unlocked
```

Sebelum total attendance mencapai 8:

``` text
Lesson 9  🔒
Lesson 10 🔒
```

Lesson 9 dan 10 tidak perlu mengikuti sequential order satu sama lain
berdasarkan requirement saat ini; keduanya terbuka ketika total
attendance mencapai 8.

------------------------------------------------------------------------

# 7. Attendance

Attendance menggunakan checklist.

Setiap checklist menyimpan tanggal dan waktu ketika attendance
dilakukan.

Format timestamp:

``` text
DD Month YYYY, HH:mm
```

Contoh:

``` text
1 October 2026, 15:32
```

Tidak perlu menyimpan sampai detik pada level tampilan/requirement.

Ketika teacher melakukan check:

``` text
attendance = true
attendance_at = current date/time
updated_at = current date/time
```

Contoh:

``` text
Lesson 1
Attendance: ✓
Attendance Date: 1 October 2026, 15:32
```

Jika attendance diubah/uncheck, `updated_at` tetap diperbarui.

Setiap lesson memiliki timestamp attendance sendiri sehingga teacher
dapat mengetahui kapan setiap pertemuan dilakukan.

------------------------------------------------------------------------

# 8. Progress Update

Progress Update ditentukan berdasarkan jumlah attendance dalam term.

Ketika:

``` text
Attendance = 8 / 10
```

maka:

``` text
Progress Update Alert = Active
```

Alert:

``` text
Progress Update Required
```

Status Progress Update:

``` text
On Progress
Completed
```

Data:

``` text
ProgressUpdate
- id
- student_id
- term_id
- status
- updated_at
```

Progress Update harus terikat dengan:

``` text
student_id + term_id
```

Sehingga status Progress Update Term 1 tidak tercampur dengan Term 2.

Contoh:

``` text
Joshua - Term 1
Progress Update: Completed

Joshua - Term 2
Progress Update: On Progress
```

Status update selalu menyimpan timestamp.

Contoh:

``` text
Status: Completed
Updated: 8 October 2026, 16:20
```

------------------------------------------------------------------------

# 9. Video Editing

Video Editing memiliki logic terpisah dari Progress Update.

Video Editing Alert muncul H+1 setelah Lesson 10 selesai.

Contoh:

``` text
Lesson 10 Attendance:
5 October 2026, 15:30

Video Editing Alert:
6 October 2026
```

Tidak ada alert Video Editing pada hari yang sama ketika Lesson 10
selesai.

Alert:

``` text
Video Editing Required
```

Status:

``` text
On Progress
Completed
```

Data:

``` text
VideoEditing
- id
- student_id
- term_id
- status
- updated_at
```

Status Video Editing juga menyimpan tanggal dan waktu setiap kali status
diperbarui.

Contoh:

``` text
Status: On Progress
Updated: 6 October 2026, 09:15
```

Kemudian:

``` text
Status: Completed
Updated: 7 October 2026, 11:42
```

------------------------------------------------------------------------

# 10. Alert Independence

Progress Update dan Video Editing adalah dua status yang berbeda.

Jangan menggunakan satu status gabungan.

Contoh:

``` text
Joshua — Term 1

Progress Update:
Completed

Video Editing:
On Progress
```

Atau:

``` text
Joshua — Term 2

Progress Update:
On Progress

Video Editing:
Completed
```

Keduanya dapat memiliki status berbeda pada waktu yang sama.

------------------------------------------------------------------------

# 11. Teacher's Note

Teacher's Note digunakan untuk mencatat material, perkembangan, atau
kejadian pada lesson tertentu.

Workflow:

``` text
Search / Select Student
        ↓
System detects Current Term
        ↓
Select Lesson
        ↓
Write Note
        ↓
Submit
```

Form:

``` text
Student
[ Joshua ▼ ]

Current Term
Term 2

Lesson
[ Lesson 7 ▼ ]

Teacher's Note
[.........................]

[ Submit ]
```

Ketika student dipilih:

-   Sistem otomatis menggunakan current term.
-   Teacher tidak perlu memilih term untuk workflow normal.
-   Term tetap tersedia sebagai dropdown jika teacher perlu memilih term
    lain.

Default:

``` text
Current Term
```

------------------------------------------------------------------------

# 12. Teacher's Note Storage

Teacher's Note tidak boleh overwrite note sebelumnya.

Setiap submit membuat record baru.

Contoh:

``` text
Joshua
Term 2
Lesson 7

Note #1
1 October 2026, 10:15
"Learned about..."

Note #2
3 October 2026, 14:20
"Continued with..."
```

Database:

``` text
TeacherNote
- id
- student_id
- term_id
- lesson_id
- note
- created_at
- updated_at
```

`created_at` digunakan ketika note dibuat.

Jika note dapat diedit, `updated_at` mencatat kapan note terakhir
diubah.

------------------------------------------------------------------------

# 13. Timestamp Rule

Prinsip umum:

> Setiap update penting harus memiliki date + time.

Format:

``` text
YYYY-MM-DD HH:mm
```

atau ditampilkan ke user sebagai:

``` text
1 October 2026, 15:32
```

Tidak perlu sampai detik.

Contoh:

``` text
Attendance checked
→ 1 October 2026, 15:32

Progress Update changed
→ 8 October 2026, 16:20

Video Editing changed
→ 9 October 2026, 10:15

Teacher Note created
→ 9 October 2026, 10:20
```

Timestamp sebaiknya menggunakan timestamp PostgreSQL/Supabase dan waktu
aktual saat perubahan dilakukan.

------------------------------------------------------------------------

# 14. Main Dashboard

Aplikasi menggunakan single main dashboard.

Tidak perlu banyak tab/page untuk workflow utama.

Contoh:

``` text
TEACHER TRACKER

[ Search student... ]

[ All Programs ▼ ]
[ All Foundations ▼ ]
[ All Terms ▼ ]
[ All Status ▼ ]
[ All Alerts ▼ ]
```

Student card:

``` text
Joshua
Kinder • Foundation 1 • Term 2

Attendance: 8 / 10
Current Lesson: Lesson 9

⚠ Progress Update Required
[ Open ]
```

Student lain:

``` text
Michael
Junior • Foundation 2 • Term 1

Attendance: 5 / 10
Current Lesson: Lesson 6

No Alert
```

Dashboard harus memungkinkan:

-   Search student
-   Filter program
-   Filter foundation
-   Filter term
-   Filter status
-   Filter alerts

------------------------------------------------------------------------

# 15. Supabase Database Structure

Database menggunakan PostgreSQL melalui Supabase.

Recommended tables:

``` text
students
terms
lessons
progress_updates
video_editing
teacher_notes
```

## students

``` text
id
name
program
foundation
active_term_id
created_at
updated_at
```

## terms

``` text
id
student_id
term_number
status
created_at
updated_at
completed_at
```

## lessons

``` text
id
term_id
lesson_number
attendance
attendance_at
created_at
updated_at
```

## progress_updates

``` text
id
student_id
term_id
status
updated_at
```

## video_editing

``` text
id
student_id
term_id
status
updated_at
```

## teacher_notes

``` text
id
student_id
term_id
lesson_id
note
created_at
updated_at
```

------------------------------------------------------------------------

# 16. Database Relationships

Relationship utama:

``` text
students
   |
   +----< terms
             |
             +----< lessons
             |
             +---- progress_updates
             |
             +---- video_editing

students
   |
   +----< teacher_notes
              |
              +---- term
              |
              +---- lesson
```

Foreign keys:

``` text
terms.student_id
    → students.id

lessons.term_id
    → terms.id

progress_updates.student_id
    → students.id

progress_updates.term_id
    → terms.id

video_editing.student_id
    → students.id

video_editing.term_id
    → terms.id

teacher_notes.student_id
    → students.id

teacher_notes.term_id
    → terms.id

teacher_notes.lesson_id
    → lessons.id
```

------------------------------------------------------------------------

# 17. Supabase / PostgreSQL Rules

Gunakan:

-   UUID untuk primary key.
-   Foreign key untuk relationship.
-   `timestamptz` untuk timestamp database.
-   PostgreSQL constraints untuk menjaga data tetap valid.
-   Default timestamp untuk `created_at` dan `updated_at`.

Program dapat menggunakan nilai:

``` text
Kinder
Junior
```

Foundation:

``` text
Foundation 1
Foundation 2
```

Term:

``` text
Term 1
Term 2
Term 3
Term 4
```

Term status:

``` text
On Progress
Completed
```

Progress Update status:

``` text
On Progress
Completed
```

Video Editing status:

``` text
On Progress
Completed
```

------------------------------------------------------------------------

# 18. Attendance Calculation

Total attendance sebuah term dihitung dari lesson yang memiliki:

``` text
attendance = true
```

Contoh:

``` text
Lesson 1 ✓
Lesson 2 ✓
Lesson 3 ✓
Lesson 4 ✓
Lesson 5 ✓
Lesson 6 ✓
Lesson 7 ✓
Lesson 8 ✓
Lesson 9 🔒
Lesson 10 🔒

Total = 8
```

Maka:

``` text
Progress Update Alert = Active
Lesson 9 = Unlocked
Lesson 10 = Unlocked
```

Tidak perlu menyimpan total attendance secara manual jika dapat dihitung
dari lessons.

------------------------------------------------------------------------

# 19. Lesson Unlock Logic

Logic:

``` text
attendance_count = COUNT(
  lessons
  WHERE term_id = current_term
  AND attendance = true
)
```

Jika:

``` text
attendance_count < 8
```

maka:

``` text
Lesson 9 locked
Lesson 10 locked
```

Jika:

``` text
attendance_count >= 8
```

maka:

``` text
Lesson 9 unlocked
Lesson 10 unlocked
```

Lesson 1--8 selalu available untuk attendance.

------------------------------------------------------------------------

# 20. Progress Alert Logic

Jika:

``` text
attendance_count >= 8
```

maka Progress Update membutuhkan perhatian.

Status default:

``` text
On Progress
```

Teacher dapat mengubah menjadi:

``` text
Completed
```

Setiap perubahan status memperbarui:

``` text
updated_at
```

------------------------------------------------------------------------

# 21. Video Editing Alert Logic

Ketika Lesson 10 memiliki:

``` text
attendance = true
```

dan memiliki:

``` text
attendance_at
```

maka Video Editing menjadi eligible untuk alert pada:

``` text
attendance_at + 1 day
```

Bukan pada hari yang sama.

Contoh:

``` text
Lesson 10:
5 October 2026, 15:30

Video Editing alert:
6 October 2026
```

Status Video Editing:

``` text
On Progress
Completed
```

------------------------------------------------------------------------

# 22. ReactJS Application Flow

Basic frontend flow:

``` text
React App
   |
   +-- Dashboard
   |
   +-- Student Management
   |
   +-- Term Management
   |
   +-- Lesson / Attendance
   |
   +-- Progress Update
   |
   +-- Video Editing
   |
   +-- Teacher Notes
   |
   +-- Supabase Client
```

Semua workflow utama tetap dapat diakses dari dashboard tanpa membuat
terlalu banyak halaman.

------------------------------------------------------------------------

# 23. Development Flow

Development:

``` text
Local ReactJS
      ↓
Connect to Supabase
      ↓
Test locally
      ↓
Build production
      ↓
Deploy to Vercel
      ↓
Same Supabase database
```

Tidak perlu membuat database lokal terpisah untuk production migration.

------------------------------------------------------------------------

# 24. MVP Scope

MVP fokus pada:

1.  Student management
2.  Program & Foundation
3.  Term management
4.  Automatic 10 lesson creation per term
5.  Attendance checklist
6.  Attendance date/time
7.  Automatic attendance count
8.  Unlock Lesson 9 & 10 after 8 attendance
9.  Progress Update status
10. Progress Update timestamp
11. Video Editing status
12. Video Editing H+1 alert
13. Video Editing timestamp
14. Teacher's Note
15. Teacher's Note history
16. Search
17. Filtering
18. Main dashboard

Tidak perlu over-engineering.

------------------------------------------------------------------------

# 25. Important Business Rules Summary

``` text
1. Foundation dan Term adalah atribut terpisah.

2. Student dapat memiliki banyak Term.

3. Setiap Term memiliki 10 Lessons.

4. Lesson 1–8 TIDAK sequential.

5. Lesson 1–8 TIDAK locked.

6. Lesson 9 dan 10 locked sebelum total attendance mencapai 8.

7. Total attendance dihitung dari lesson dengan attendance = true.

8. Setelah total attendance >= 8:
   Lesson 9 dan Lesson 10 unlocked.

9. Progress Update aktif ketika attendance mencapai 8.

10. Progress Update memiliki status:
    On Progress / Completed.

11. Video Editing memiliki status:
    On Progress / Completed.

12. Progress Update dan Video Editing independent.

13. Video Editing alert muncul H+1 setelah Lesson 10 attendance.

14. Teacher Note tidak overwrite note lama.

15. Setiap attendance menyimpan date + time.

16. Setiap perubahan status menyimpan date + time.

17. Setiap note memiliki created_at.

18. Timestamp cukup sampai menit, tidak perlu detik.

19. Database menggunakan Supabase PostgreSQL.

20. Frontend menggunakan ReactJS.

21. Deployment menggunakan Vercel.

22. MVP harus tetap sederhana dan cepat digunakan.
```
