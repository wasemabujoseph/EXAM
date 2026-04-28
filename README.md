# MD Curriculum Exam Hub

A professional medical curriculum dashboard and exam resource hub. Browse subjects, credits, and academic materials organized by year and semester.

## Features
- **Full MD Curriculum**: Complete Grade 1-6 curriculum structure.
- **Interactive Dashboard**: Navigate by Year and Semester.
- **Subject Details**: View ECTS credits, components, and resources.
- **Resource Hub**: Ready for Exams, PDFs, and Notes.
- **Premium UI**: Clean, medical-grade academic interface.
- **Mobile Responsive**: Works on all devices.

## Curriculum Data
The curriculum is structured in `src/data/curriculum.ts`. It includes:
- Faculty Information
- Years/Courses (I-VI)
- Semesters (I-II per year)
- Subjects with ECTS credits and components
- Resource arrays for future content (exams, pdfs, notes)

## Demo Login
The dashboard is protected by a frontend access gate.
- **URL**: `/login` (redirects automatically if not logged in)
- **Email**: `admin@exam.com`
- **Password**: `exam12345`

## Adding Resources
To add new exams or PDFs:
1. Open `src/data/curriculum.ts`.
2. Locate the specific subject.
3. Add a new object to the `sub.exams`, `sub.pdf`, or `sub.note` array:
   ```ts
   {
     title: "Midterm 2024",
     url: "/resources/year-1/anatomy/midterm-2024.pdf",
     type: "pdf",
     year: "2024"
   }
   ```

## Development
- **Run Locally**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Deployment
The project is automatically deployed to GitHub Pages via GitHub Actions:
[https://wasemabujoseph.github.io/EXAM/](https://wasemabujoseph.github.io/EXAM/)
