let clientAdapter = require('../modules/clientAdapter') ;
const sgMail = require('@sendgrid/mail');

class functions {

    async isProgramOwner(user, program) {
        
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

    async isProgramMember(user, program) {
        
        // Can access users in charge of program owner.
        for (let key in program.members) {
            let member = program.members[key] ;

            if (member.uid == user.uid) {
                return true ;
            }
        }

        return false; 
    }

    async sendEmail(fromEmail, toEmail, subject, message) {
        
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: toEmail,
            from: fromEmail,
            subject: subject,
            text: message,
            html: message.replace(/\n/g, '<br />'),
        };
    
        await sgMail.send(msg);
    }
}

module.exports =  new functions;