import i18next from "i18next";

i18next.init({
    lng: "en",
    debug: true,
    resources: {
        en: {
            translation: {
                key: "hello world",
            },
        },
    },
});
