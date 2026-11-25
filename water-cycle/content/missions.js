/*
 * محتوى «رحلة قطرة الماء»
 * ------------------------------------------------------------------
 * كل النصوص والأسئلة والتلميحات هنا. عدّل هذا الملف فقط لتغيير المحتوى،
 * ولا حاجة لتعديل app.js أو index.html.
 *
 * لإضافة مهمة جديدة: انسخ كائن المهمة داخل missions وغيّر id والنصوص.
 * حقل audio (اختياري) في أي رسالة: مسار ملف صوتي مسجَّل (mp3) يُشغَّل
 * بدل القراءة الآلية، مثل: audio: "audio/evap-intro.mp3"
 *
 * مستويات الدعم (scaffolds) تُعرض بالترتيب: كل خطأ أو طلب مساعدة
 * ينقل الطالب إلى المستوى التالي، ولا تُعطى الإجابة مباشرة.
 */
window.WATER_JOURNEY = {
  meta: {
    title: "رحلة قطرة الماء",
    stages: ["التبخّر", "التكاثف", "الهطول", "التجمّع"]
  },

  kanaan: {
    name: "كنعان",
    moods: {
      smile: "assets/kanaan-smile.png",
      happy: "assets/kanaan-happy.png",
      excited: "assets/kanaan-excited.png",
      thinking: "assets/kanaan-thinking.png",
      curious: "assets/kanaan-curious.png",
      surprised: "assets/kanaan-surprised.png",
      confident: "assets/kanaan-confident.png"
    },
    celebrate: "assets/kanaan-celebrate.png"
  },

  /* أجزاء البيت: كل مهمة تمنح موردًا يبني جزءًا واحدًا */
  house: {
    title: "بيت كنعان",
    parts: [
      { id: "foundation", label: "الأساس" },
      { id: "walls", label: "الجدران" },
      { id: "roof", label: "السقف" },
      { id: "garden", label: "الزيتونة والحديقة" }
    ]
  },

  missions: [
    {
      id: "evaporation",
      order: 1,
      eyebrow: "المهمة الأولى",
      title: "التبخّر",
      objective: "أكتشفُ ما الذي يجعل الماء يصعد إلى السماء.",

      intro: {
        mood: "smile",
        full: "أهلًا يا صديقي! قطرة الماء تريد أن تصعد إلى السماء. اضغط على الشمس والماء والبخار، ولاحظ ماذا يحدث.",
        brief: "أنت مستكشف ماهر! لاحظ المشهد، ثم أجب عن السؤال."
      },

      explore: {
        hotspots: {
          sun: {
            label: "الشمس",
            card: { title: "الشمس", text: "ترسل الشمس أشعة دافئة إلى الماء. راقب: ماذا يحدث للماء عندما يسخن؟" }
          },
          water: {
            label: "الماء",
            card: { title: "الماء", text: "هذا ماء سائل في البِركة. قطرة الماء تعيش هنا الآن." }
          },
          vapor: {
            label: "بخار الماء",
            card: { title: "بخار الماء", text: "بخار الماء غاز خفيف لا نكاد نراه، لذلك يرتفع إلى الأعلى." }
          }
        },
        done: { mood: "happy", text: "لاحظتَ كل شيء! الآن أجب عن السؤال." }
      },

      question: {
        prompt: "ما العامل الذي يساعد الماء على التبخّر؟",
        choices: [
          { id: "wind", label: "الرياح", icon: "wind", correct: false,
            nudge: "الرياح تحرّك البخار بعد أن يتكوّن." },
          { id: "sun", label: "حرارة الشمس", icon: "sun", correct: true },
          { id: "rain", label: "الهطول", icon: "rain", correct: false,
            nudge: "الهطول هو نزول الماء من الغيوم، أي عكس الصعود." }
        ]
      },

      /* الدعم المتدرّج: 1 سؤال تلميحي، 2 توجيه بصري، 3 تلميح أوضح، 4 شرح مبسّط */
      scaffolds: [
        { level: 1, type: "question", mood: "thinking",
          text: "فكّر: ماذا يحدث للماء في الإبريق عندما نسخّنه؟" },
        { level: 2, type: "visual", mood: "curious", highlight: "sun", demo: "heat",
          text: "انظر إلى المشهد. راقب الماء عندما تشرق الشمس عليه." },
        { level: 3, type: "hint", mood: "confident", highlight: "sun",
          text: "الماء يحتاج إلى شيء دافئ حتى يتحوّل إلى بخار. ما الشيء الدافئ في السماء؟" },
        { level: 4, type: "explain", mood: "smile", highlight: "sun", demo: "heat",
          text: "عندما تسخّن أشعةُ الشمس الماءَ، يتحوّل إلى بخار خفيف يرتفع إلى الأعلى. هذا هو التبخّر. اختر الآن." }
      ],

      feedback: {
        correct: { mood: "excited",
          text: "أحسنت! حرارة الشمس تسخّن الماء، فيتحوّل إلى بخار يصعد إلى السماء. هذا هو التبخّر." },
        independent: "وصلتَ إلى الإجابة وحدك!",
        withHelp: "استفدتَ من التلميح ووصلت. رائع!"
      },

      reward: {
        part: "foundation",
        badge: "حصلتَ على مورد بناء جديد",
        resource: "حجارة الأساس",
        story: "صعدت قطرة الماء مع البخار، وبإجابتك حصلنا على حجارة لأساس البيت.",
        action: "ضع الحجارة في مكانها",
        built: "صار للبيت أساس متين! بقيت ٣ مهام ليكتمل المكان."
      },

      next: {
        label: "المهمة التالية: التكاثف",
        available: false,
        note: "تُفتح بعد مراجعة هذه المهمة"
      }
    }
  ]
};
