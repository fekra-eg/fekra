import type { Locale } from './routing'

/** Cookie Preferences panel copy — Fekra_Tech_Website_Policies_01_October_2026. */
export const cookiePreferencesCopy: Record<Locale, {
  intro: string; introNote: string
  necessary: string; alwaysActive: string; necessaryBody: string
  analyticsBody: string; marketingBody: string; optional: string; offByDefault: string
  acceptAll: string; essentialOnly: string; save: string; close: string
  changeMind: string; morePolicies: string; cookiePolicy: string; privacyPolicy: string
  saved: string; failed: string
}> = {
  en: {
    intro: 'Choose which optional technologies Fekra Tech may use on this website. You can accept all optional categories, use necessary technologies only or choose each category separately.',
    introNote: 'Your choice does not prevent you from browsing the website, contacting us or applying for an opportunity.',
    necessary: 'Necessary', alwaysActive: 'Always Active',
    necessaryBody: 'These technologies keep the website working and support security, form verification, language selection, consent records and authorised staff sessions. They are not used to build advertising audiences and cannot be switched off through this panel.',
    analyticsBody: 'Allow configured analytics tools, such as Google Analytics, to help us understand website visits, page use and enquiry activity so we can improve the website.',
    marketingBody: 'Allow configured advertising tools, such as the LinkedIn Insight Tag, to measure campaign performance and, where enabled, create website audiences for relevant advertising.',
    optional: 'Optional', offByDefault: 'This category is off by default until you choose to allow it.',
    acceptAll: 'Accept all', essentialOnly: 'Essential only', save: 'Save preferences', close: 'Close preferences',
    changeMind: 'You can reopen Cookie Preferences from the website footer at any time. After withdrawing optional consent, reload the page to apply the updated loading rules. You can delete previously stored cookies through your browser settings. Your choices apply to this browser and device.',
    morePolicies: 'For more information, read our policies:', cookiePolicy: 'Cookie Policy', privacyPolicy: 'Privacy Policy',
    saved: 'Your cookie preferences have been saved.', failed: 'We could not save your cookie preferences. Please try again.',
  },
  ar: {
    intro: 'اختر التقنيات الاختيارية التي يمكن لفكرة تك استخدامها على هذا الموقع. يمكنك قبول جميع الفئات الاختيارية، أو استخدام التقنيات الضرورية فقط، أو اختيار كل فئة على حدة.',
    introNote: 'اختيارك لا يمنعك من تصفح الموقع أو التواصل معنا أو التقدم لأي فرصة.',
    necessary: 'الضرورية', alwaysActive: 'مفعّلة دائمًا',
    necessaryBody: 'تحافظ هذه التقنيات على عمل الموقع وتدعم الأمان والتحقق من النماذج واختيار اللغة وسجلات الموافقة وجلسات الموظفين المصرّح لهم. لا تُستخدم لبناء جماهير إعلانية ولا يمكن إيقافها من هذه اللوحة.',
    analyticsBody: 'السماح لأدوات التحليلات المُعدّة، مثل Google Analytics، بمساعدتنا على فهم زيارات الموقع واستخدام الصفحات ونشاط الاستفسارات لتحسين الموقع.',
    marketingBody: 'السماح لأدوات الإعلان المُعدّة، مثل LinkedIn Insight Tag، بقياس أداء الحملات، وإنشاء جماهير للموقع لإعلانات ملائمة عند تفعيل ذلك.',
    optional: 'اختيارية', offByDefault: 'هذه الفئة متوقفة افتراضيًا حتى تختار السماح بها.',
    acceptAll: 'قبول الكل', essentialOnly: 'الضرورية فقط', save: 'حفظ التفضيلات', close: 'إغلاق التفضيلات',
    changeMind: 'يمكنك إعادة فتح تفضيلات ملفات الارتباط من تذييل الموقع في أي وقت. بعد سحب الموافقة الاختيارية، أعد تحميل الصفحة لتطبيق القواعد الجديدة. يمكنك حذف ملفات الارتباط المخزّنة سابقًا من إعدادات المتصفح. تنطبق اختياراتك على هذا المتصفح والجهاز.',
    morePolicies: 'لمزيد من المعلومات، اطّلع على سياساتنا:', cookiePolicy: 'سياسة ملفات الارتباط', privacyPolicy: 'سياسة الخصوصية',
    saved: 'تم حفظ تفضيلات ملفات الارتباط.', failed: 'تعذّر حفظ تفضيلات ملفات الارتباط. يُرجى المحاولة مرة أخرى.',
  },
  de: {
    intro: 'Wählen Sie, welche optionalen Technologien Fekra Tech auf dieser Website verwenden darf. Sie können alle optionalen Kategorien akzeptieren, nur notwendige Technologien verwenden oder jede Kategorie einzeln wählen.',
    introNote: 'Ihre Wahl hindert Sie nicht daran, die Website zu nutzen, uns zu kontaktieren oder sich zu bewerben.',
    necessary: 'Notwendig', alwaysActive: 'Immer aktiv',
    necessaryBody: 'Diese Technologien halten die Website funktionsfähig und unterstützen Sicherheit, Formularprüfung, Sprachauswahl, Einwilligungsnachweise und autorisierte Mitarbeitersitzungen. Sie werden nicht für Werbezielgruppen genutzt und können hier nicht deaktiviert werden.',
    analyticsBody: 'Erlauben Sie konfigurierte Analysetools wie Google Analytics, damit wir Besuche, Seitennutzung und Anfragen verstehen und die Website verbessern können.',
    marketingBody: 'Erlauben Sie konfigurierte Werbetools wie den LinkedIn Insight Tag, um Kampagnen zu messen und, falls aktiviert, Website-Zielgruppen für relevante Werbung zu bilden.',
    optional: 'Optional', offByDefault: 'Diese Kategorie ist standardmäßig deaktiviert, bis Sie sie erlauben.',
    acceptAll: 'Alle akzeptieren', essentialOnly: 'Nur notwendige', save: 'Einstellungen speichern', close: 'Einstellungen schließen',
    changeMind: 'Sie können die Cookie-Einstellungen jederzeit über den Footer erneut öffnen. Laden Sie die Seite nach dem Widerruf neu, damit die neuen Regeln gelten. Gespeicherte Cookies können Sie in Ihren Browsereinstellungen löschen. Ihre Wahl gilt für diesen Browser und dieses Gerät.',
    morePolicies: 'Weitere Informationen finden Sie in unseren Richtlinien:', cookiePolicy: 'Cookie-Richtlinie', privacyPolicy: 'Datenschutzerklärung',
    saved: 'Ihre Cookie-Einstellungen wurden gespeichert.', failed: 'Ihre Cookie-Einstellungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.',
  },
  fr: {
    intro: 'Choisissez les technologies facultatives que Fekra Tech peut utiliser sur ce site. Vous pouvez accepter toutes les catégories facultatives, n’utiliser que les technologies nécessaires ou choisir chaque catégorie séparément.',
    introNote: 'Votre choix ne vous empêche pas de parcourir le site, de nous contacter ou de postuler.',
    necessary: 'Nécessaires', alwaysActive: 'Toujours actifs',
    necessaryBody: 'Ces technologies assurent le fonctionnement du site et soutiennent la sécurité, la vérification des formulaires, le choix de la langue, l’enregistrement du consentement et les sessions du personnel autorisé. Elles ne servent pas à créer des audiences publicitaires et ne peuvent pas être désactivées ici.',
    analyticsBody: 'Autoriser les outils d’analyse configurés, comme Google Analytics, pour nous aider à comprendre les visites, l’utilisation des pages et les demandes afin d’améliorer le site.',
    marketingBody: 'Autoriser les outils publicitaires configurés, comme le LinkedIn Insight Tag, pour mesurer les campagnes et, si activé, créer des audiences pour une publicité pertinente.',
    optional: 'Facultatif', offByDefault: 'Cette catégorie est désactivée par défaut jusqu’à ce que vous l’autorisiez.',
    acceptAll: 'Tout accepter', essentialOnly: 'Nécessaires uniquement', save: 'Enregistrer les préférences', close: 'Fermer les préférences',
    changeMind: 'Vous pouvez rouvrir les préférences de cookies depuis le pied de page à tout moment. Après un retrait du consentement, rechargez la page pour appliquer les nouvelles règles. Vous pouvez supprimer les cookies déjà stockés dans les réglages du navigateur. Vos choix s’appliquent à ce navigateur et à cet appareil.',
    morePolicies: 'Pour en savoir plus, consultez nos politiques :', cookiePolicy: 'Politique de cookies', privacyPolicy: 'Politique de confidentialité',
    saved: 'Vos préférences de cookies ont été enregistrées.', failed: 'Impossible d’enregistrer vos préférences de cookies. Veuillez réessayer.',
  },
  es: {
    intro: 'Elige qué tecnologías opcionales puede usar Fekra Tech en este sitio. Puedes aceptar todas las categorías opcionales, usar solo las necesarias o elegir cada categoría por separado.',
    introNote: 'Tu elección no te impide navegar por el sitio, contactarnos ni postularte a una oportunidad.',
    necessary: 'Necesarias', alwaysActive: 'Siempre activas',
    necessaryBody: 'Estas tecnologías mantienen el sitio en funcionamiento y respaldan la seguridad, la verificación de formularios, la elección de idioma, los registros de consentimiento y las sesiones del personal autorizado. No se usan para crear audiencias publicitarias y no pueden desactivarse aquí.',
    analyticsBody: 'Permitir herramientas de analítica configuradas, como Google Analytics, para entender las visitas, el uso de páginas y las consultas y así mejorar el sitio.',
    marketingBody: 'Permitir herramientas publicitarias configuradas, como LinkedIn Insight Tag, para medir campañas y, si está activado, crear audiencias del sitio para publicidad relevante.',
    optional: 'Opcional', offByDefault: 'Esta categoría está desactivada por defecto hasta que decidas permitirla.',
    acceptAll: 'Aceptar todo', essentialOnly: 'Solo necesarias', save: 'Guardar preferencias', close: 'Cerrar preferencias',
    changeMind: 'Puedes volver a abrir las preferencias de cookies desde el pie de página en cualquier momento. Tras retirar el consentimiento, recarga la página para aplicar las nuevas reglas. Puedes borrar las cookies ya guardadas desde la configuración del navegador. Tus elecciones se aplican a este navegador y dispositivo.',
    morePolicies: 'Para más información, consulta nuestras políticas:', cookiePolicy: 'Política de cookies', privacyPolicy: 'Política de privacidad',
    saved: 'Tus preferencias de cookies se han guardado.', failed: 'No pudimos guardar tus preferencias de cookies. Inténtalo de nuevo.',
  },
}
