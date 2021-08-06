let clientAdapter = require('../modules/clientAdapter') ;
const sgMail = require('@sendgrid/mail');

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