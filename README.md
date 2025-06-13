# Carousel Preview

Carousel Preview is a lightweight web tool for quickly arranging and previewing Instagram carousel posts. Upload images, drag to reorder, and export filenames or a moodboard PDF. The project was created by Aviram, a software production agency.

The preview area displays slides in a four-column contact-sheet grid so you can review the whole sequence at once.

## Features

- **Drag & Drop Uploads** – Add images by selecting files or dropping them into the browser.
- **Paste Support** – Paste images directly from the clipboard.
- **Reordering** – Use drag and drop (via [Sortable](https://github.com/SortableJS/Sortable)) to change the order of slides.
- **Contact Sheet View** – Slides are shown four across for an at-a-glance overview.
- **20 Image Limit** – Upload up to twenty images per project.
- **Caption & Tags** – Compose copy and tags alongside the carousel.
- **Exports**
  - **Filename list** – Download a text file of image filenames in order.
  - **Moodboard** – Create a landscape PDF contact sheet (1920×1080) with a 4×3 grid. Images are cropped to Instagram's 1080×1350 resolution using [jsPDF](https://github.com/parallax/jsPDF).
  - **Metadata** – Export captions, tags, and image details.
- **Safe Zone Overlay** – Optional mask to visualize Instagram's 4:5 safe area.
- **Light/Dark Toggle** – Switch the interface theme at any time.
- **Per-image Actions** – Replace or delete each slide with single-click icons.
- **Dark Mode** – Adapts to system dark mode preferences.

## Development

No build steps are required. Clone the repo and open `index.html` in a modern browser. The JavaScript (`script.js`) and styles (`styles.css`) can be edited directly.

## Project Structure

```
index.html   -- Main HTML page
script.js     -- Carousel logic and export features
script.old.js -- Original script kept for reference
styles.css    -- Layout and theme styles
```

## License

This project is provided as-is for demonstration and is not currently licensed for commercial use.

