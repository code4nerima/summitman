let clientAdapter = require('../modules/clientAdapter') ;

class functions {

    async isAccessAvailableToProgram(user, program) {
        

        if (user.role == 1) {
            return true ;
        }
    
        for (let key in program.owners) {
            let owner = program.owners[key] ;

            if (owner.uid == user.uid) {
                return true ;
            }
        }
        
        if (user.email == program.email) {
            return true ;
        }

        return false; 
    }
}

module.exports =  new functions;