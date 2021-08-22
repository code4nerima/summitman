function getRoleString(role) {
    let roleString ;

    if (role == 0) {
        roleString = '参加者' ;
    } else if (role == 1) {
        roleString = '管理者' ;
    } else if (role == 2) {
        roleString = '配信担当' ;
    } else if (role == 3) {
        roleString = '翻訳担当' ;
    } else if (role == 4) {
        roleString = 'グラレコ担当' ;
    }

    return roleString ;
}

function getLangLabel(lang) {
    if (lang == "ja") {
        return "日本語" ;
    } else if (lang == "en") {
        return "英語" ;
    } else if (lang == "zh-TW") {
        return "繁体字" ;
    } else if (lang == "zh-CN") {
        return "簡体字" ;
    } else {
        return lang ;
    }
}
