function getRoleString(role) {
    let roleString ;

    if (role == 0) {
        roleString = 'スタッフ' ;
    } else if (role == 1) {
        roleString = '管理者' ;
    } else if (role == 2) {
        roleString = '配信担当' ;
    } else if (role == 3) {
        roleString = '翻訳担当' ;
    }

    return roleString ;
}