const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jayvardhanpatil123@gmail.com',
        subject: 'Thanks for Signing Up !',
        text: `Welcome to the app, ${name}. Let me know how you get along !`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jayvardhanpatil123@gmail.com',
        subject: 'Bye :(',
        text: `Hope to see you soon ${name}. Sorry to see you go`
    })
}


module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}