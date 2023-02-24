## CS50's Web Programming with Python and JavaScript

# Project 3 - Mail

This project consists of designing a front-end for an email client that makes API calls to send and receive emails.
The app is a single web page, and depending on what the user wants to achieve, JavaScript sends API calls to the server and load new information dynamically, without refreshing the page.

*The emails sent and received in this project will be entirely stored in a database.*

The application has the following features:

1. **Register, log in and log out:** Users can register for a new account, and log in / log out.

1. **Mailbox:** When a user visits their Inbox, Sent mailbox, or Archive, a GET request to a specific API route is made to request emails for a particular mailbox. Every email is displayed in its own box, that displays the sender email, the subject and the timestamp. The emails are listed in reverse chronological order. 
In addition to that, in the **Inbox** and **Archive** mailboxes, the user has the option, for every email, to archive/unarchive it or mark it as read/unread.

1. **Send Mail:** The user can click on the compose button, and the user will be presented with a "New mail" form. The form fields to be filled are: recipients, subject and body. When the user clicks the submit button, a POST request to a specific API route is made to send the email. The user will be presented with a message stating if the email was successfully sent or not.

1. **View Mail:** When a user clicks on an email, a GET request to an API route is made to request the email. The user is then taken to a view that displays the content of the email. Clicking on an email marks it as read, by making a PUT request to the appropriate API route. Read emails have a grey background when displayed in a mailbox.
There are two actions that can be made on an email:
    *  **Archive / Unarchive:** When viewing an Inbox email, users are presented with a button that lets them archive the email. When viewing an Archive email, users are presented with a button that lets them unarchive the email. This requirement does not apply to emails in the Sent mailbox. Changing the archive state of an email is done by a PUT request to the appropriate API route.
    * **Reply:** When viewing an email, users are presented with a “Reply” button that lets them reply to the email. When the reply button is clicked, users are presented with the "New mail" form. 
        * The recipient field is pre-filled to whoever sent the original email.
        * The subject field is pre-filled with `Re: ` followed by whatever the subject of the original email was. (If the subject line already begins with `Re: `, it will not be added again).
        * The body field is pre-filled with a line like `On Jan 1 2020, 12:00 AM foo@example.com wrote:` followed by the original text of the email.
