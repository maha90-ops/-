# assets/images
كل الرسوم الحالية مولّدة برمجيًا (SVG) داخل `components/scenes.js` فتعمل دون إنترنت.
لاستبدال مشهد برسم احترافي: ضع الصورة هنا (SVG أو WebP)، ثم استبدل الدالة المقابلة في `scenes.js`
بوسم `<image href="assets/images/...">`، وأضف المسار إلى قائمة `CORE` في `service-worker.js`.
