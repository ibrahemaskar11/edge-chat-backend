import nodemailer from "nodemailer";
import { IUser } from "./interfaces";

class Email {
  to: string;
  firstName: string;
  url: string;
  from: string;
  constructor(user: IUser, url: string) {
    this.to = user.email;
    this.url = url;
    this.firstName = user.name.split(" ")[0];
    this.from = `undefined proj <${process.env.EMAIL_FROM}>`;
  }
  newTransort(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: process.env.EMAIL_DUMMY_HOST,
      port: 587,
      auth: {
        user: process.env.EMAIL_DUMMY_USERNAME,
        pass: process.env.EMAIL_DUMMY_PASSWORD,
      },
    });
  }
  async sendResetToken() {
    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please make a put request to the following link:</p>
      <a href=${process.env.CLIENT_URL}/auth/reset-password/${this.url} clicktracking=off>${process.env.CLIENT_URL}/auth/reset-password/${this.url}</a>
    `;
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: "Your password reset token (valid for 10 minutes)",
      html: message,
    };
    await this.newTransort().sendMail(mailOptions);
    console.log("email sent");
  }
}
export default Email;
