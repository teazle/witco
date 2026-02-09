const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");
const path = require("path");
require("dotenv");
module.exports = class Email {
  constructor(user, type = null) {
    if (type == "orderDelivered") {
      this.to = user.email;
      this.do_number = user.do_number;
      // this.cc = process.env.ccEmail ;
    }

    this.email = user.email;
    this.name = user.name;
    this.from = "Witco <simon.seow@witco.com.sg>"
  }

  newTransport() {
    return nodemailer.createTransport({
      name: "mail.witco.com.sg",
      host: "mail.witco.com.sg",
      port: 465,
      secure:true,
      auth: {
        user: "simon.seow@witco.com.sg",
        pass: "Witco2006",
      },
      // logger: true,
      // debug: true 
    });
  }

  async orderDelivered(template, subject) {
    const html = pug.renderFile(`${__dirname}/../templates/${template}.pug`, {
      name: this.name,
      email: this.email,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      cc: this.cc,
      subject,
      html,
      text: htmlToText(html),
      attachments: [
        {
          filename: `invoice-${this.do_number}.pdf`,
          path: `${__dirname}/../../docs/invoice-${this.do_number}.pdf`,
          contentType: "application/pdf",
        },
      ],
    };

    console.log("Mail send successfully");

    await this.newTransport().sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
    });
  }
};
