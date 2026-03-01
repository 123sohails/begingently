# 📖 BeginGently: A Revert-Focused Islamic Web App

**BeginGently** (صدقة) - "A charitable gift built as lasting charity" (ṣadaqah jāriyah)

This is a calm, compassionate Islamic learning platform designed specifically for reverts and sincere seekers. It emphasizes emotional safety, gentle learning, and the understanding that faith grows gradually—not overnight.

---

## 🌿 Philosophy

**Tone & Core Values:**
- Gentle, non-judgmental, and reassuring
- Normalize mistakes as part of learning
- Emphasize sincerity over perfection
- Avoid debates, fear-based language, and complex theological disputes
- Focus on practical, lived Islam

**Design Principles:**
- Minimal, calm aesthetic (soft green #6b9e7f, neutral colors)
- Mobile-first, responsive
- One main action per page
- Lots of white space and soft shadows
- Rounded cards for warmth

---

## 📂 Project Structure

```
sadaqa/
├── index.html              # Home page (reassurance + 6 quick-start cards)
├── about.html              # Why this app exists + core principles
├── library.html            # Hub for all learning content
├── css/
│   └── main.css            # All styling (no Tailwind build needed)
├── js/
│   └── main.js             # Navigation + smooth scroll
└── library/
    ├── salah.html          # Prayer guide (3 levels: just pray → understand → deepen)
    ├── quran.html          # Qur'an introduction + recommended passages
    ├── prophet.html        # Life & character of Prophet Muhammad ﷺ
    ├── hadith.html         # Short teachings for daily life
    ├── beliefs.html        # Islamic beliefs + the five pillars
    └── practicing.html     # 30-day beginner journey + long-term habits
```

---

## 🚀 How to Use

### **Locally (No Server Needed)**
1. Open `index.html` in your browser
2. Navigate using the navbar (Home, About, Library)
3. All pages work offline—no dependencies

### **Host on the Web**
Several free options:

**Option A: GitHub Pages** (Free, easy)
```bash
# Create a GitHub repo called "sadaqa"
# Upload all files to the repo
# Enable GitHub Pages in repo settings → Deploy from main branch
# Live at: yourusername.github.io/sadaqa
```

**Option B: Netlify** (Free)
1. Go to netlify.com
2. Drag & drop the `sadaqa` folder
3. Instantly published

**Option C: Any Web Host**
- Upload files via FTP/cPanel to any hosting provider
- Works on any server (no Node.js, build process, or database needed)

---

## 💡 Content Overview

| Page | Purpose | Tone |
|------|---------|------|
| **Home** | Reassure + 6 main pathways | Calming, welcoming |
| **About** | Explain why app exists + principles | Transparent, mission-focused |
| **Salah** | 3-level prayer guide + Wudu + FAQ | Practical & encouraging |
| **Qur'an** | Start-here passages + how to read | Accessible, reflective |
| **Prophet ﷺ** | His life + character + teachings | Historical, relatable |
| **Hadith** | 10 short teachings for daily life | Practical, actionable |
| **Beliefs** | Core Islamic concepts + 5 pillars | Logical, reflective |
| **Practicing** | 30-day plan + long-term habits | Step-by-step, achievable |

---

## 🎨 Color Palette

```css
Primary Green:     #6b9e7f  (calm, welcoming, nature-inspired)
Primary Light:     #d4e8e0  (soft, approachable)
Neutral Light:     #f9f8f6  (warm white)
Neutral Gray:      #7f8c8d  (readable, calm)
White:             #ffffff  (clean, open)
Shadow:            0 4px 12px rgba(0, 0, 0, 0.08)  (soft, not harsh)
```

---

## 🔧 Customization

### **Change Colors**
Edit `css/main.css` - Look for `:root` variables at the top:
```css
:root {
  --primary-green: #6b9e7f;    /* Change this */
  --primary-light: #d4e8e0;    /* Change this */
  /* ... etc */
}
```

### **Update Content**
- Each HTML file is self-contained and easy to edit
- No build process—just edit HTML and refresh

### **Add Pages**
1. Create a new `.html` file
2. Copy the navbar structure from any page
3. Link it in the navbar on all pages

### **Add Navigation Links**
Edit the navbar in any HTML file:
```html
<ul class="nav-links">
  <li><a href="index.html">Home</a></li>
  <li><a href="your-new-page.html">New Page</a></li>
  <!-- etc -->
</ul>
```

---

## 📱 Features

✅ **Mobile-First Design**
- Responsive on phones, tablets, desktops
- Touch-friendly buttons

✅ **No Dependencies**
- No Node.js, npm, or build tools needed
- Pure HTML/CSS/JavaScript
- Works offline

✅ **Accessibility**
- Clear, readable fonts
- High contrast text
- Semantic HTML

✅ **Performance**
- Fast load times (no heavy packages)
- Small file size
- Smooth animations (CSS-only)

---

## 📚 Content Approach

### **What We Include:**
- Practical, beginner-friendly guidance
- Widely accepted Islamic sources
- Character-focused (Prophet's life, Hadith teachings)
- Emotional safety & reassurance

### **What We Avoid:**
- Fatwas (Islamic legal rulings) or controversial positions
- Sectarian divisions
- Complex theological debates
- Fear-based language
- "You must" imperatives (instead: gentle encouragement)

---

## 🎯 Success Metrics

A user should feel:
1. **Calmer** after visiting
2. **Understood** (not judged)
3. **Able to take one small step** toward Allah

---

## 📝 License & Credits

This app is built as **Ṣadaqah Jāriyah** (lasting charity) for anyone seeking to learn about Islam.

Built with care, patience, and sincerity.

---

## 🙏 Contributing

If you'd like to improve this app:
- Suggest content improvements
- Report accessibility issues
- Add translations
- Create local community forks

The goal is to help people. If you can make it better for a revert somewhere, please do.

---

## 📧 Questions?

This app is self-contained and simple by design. All content is on-page and editable. 

For Islamic guidance beyond this app, consult:
- Local Islamic scholars
- Islamic centers/Masajid
- Trusted online resources (Islamqa.info, Quran.com, etc.)

---

**بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيم**

*In the name of Allah, the Most Merciful*

May this app serve those seeking truth and guidance.
