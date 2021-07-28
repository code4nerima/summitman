let clientAdapter = require('../modules/clientAdapter') ;

class functions {

    async isAccessAvailableToProgram(user, program) {
        
        // Can access user in charge of admin and localization.
        if (user.role == 1 || user.role == 3) {
            return true ;
        }
    
        // Can access users in charge of program owner.
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