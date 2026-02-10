const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");
const path = require("path");
require("dotenv").config();
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

  async orderDelivered(template, subject, attachment) {
    const html = pug.renderFile(`${__dirname}/../templates/${template}.pug`, {
      name: this.name,
      email: this.email,
    });

    const attachments = [];
    if (attachment) {
      attachments.push(attachment);
    } else if (this.do_number) {
      const fallbackPath = path.join(
        __dirname,
        "..",
        "..",
        "uploads",
        "invoice",
        `invoice-${this.do_number}.pdf`
      );
      attachments.push({
        filename: `invoice-${this.do_number}.pdf`,
        path: fallbackPath,
        contentType: "application/pdf",
      });
    }

    const mailOptions = {
      from: this.from,
      to: this.to,
      cc: this.cc,
      subject,
      html,
      text: htmlToText(html),
      attachments,
    };

    try {
      const info = await this.newTransport().sendMail(mailOptions);
      console.log("Mail sent", info?.messageId || "");
    } catch (error) {
      console.error("Mail send failed:", error);
    }
  }
};
