let clientAdapter = require('../modules/clientAdapter') ;

class functions {

    async isAccessAvalableToProgram(req, programId) {
        let currentUser = req.session.user ;
        let uid = currentUser.uid ;
        let user = (await clientAdapter.getUserProfile(req, uid)).data ;
        let program = (await clientAdapter.getProgram(req, programId)).data ;

        if (user.role == 1) {
            return true ;
        }
    
        for (let key in program.owners) {
            let owner = program.owners[key] ;

            if (owner.uid == uid) {
                return true ;
            }
        }
        
        if (currentUser.email == program.email) {
            return true ;
        }

        return false; 
    }
}

module.exports =  new functions;