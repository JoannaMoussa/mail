document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  //send email
  document.querySelector('#submit_btn').addEventListener('click', (event) => {
    event.preventDefault();
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.getElementById('compose-recipients').value,
        subject: document.getElementById('compose-subject').value,
        body: document.getElementById('compose-body').value
      })
    })
    .then(response => {
      return response.json().then(json => {
        return response.ok ? json : Promise.reject(json.error);
      });
    })
    .then(() => {
      load_mailbox('sent');
    })
    .catch(error_msg => {
      const error_div = document.createElement('div');
      error_div.classList.add('alert','alert-danger');
      error_div.setAttribute('id', 'msg_container');
      error_div.setAttribute('role', 'alert');
      error_div.innerHTML = error_msg;
      document.querySelector('#error_msg_container').append(error_div);
    })
  });


  // By default, load the inbox
  load_mailbox('inbox');
});

function remove_messages() {
  return document.querySelector('#error_msg_container').innerHTML = "";
}


function compose_email() {
  remove_messages();
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  remove_messages();
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //get the emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach((email) => {
      const email_container = document.createElement('div');
      email_container.setAttribute('id', 'email-container');
      if (email.read) {
        email_container.style.backgroundColor = "lightgrey";
      }
      const left_container = document.createElement('div');
      left_container.setAttribute('id', 'left-container');
      const sender_container = document.createElement('div');
      sender_container.setAttribute('id', 'sender-container');
      sender_container.innerHTML = email.sender;
      const subject_container = document.createElement('div');
      subject_container.innerHTML = email.subject;
      left_container.append(sender_container);
      left_container.append(subject_container);
      email_container.append(left_container);

      const right_container = document.createElement('div');
      right_container.setAttribute('id', 'right-container');
      right_container.innerHTML = email.timestamp;
      email_container.append(right_container);

      email_container.addEventListener('click', () => {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })

        fetch(`/emails/${email.id}`)
        .then(response => response.json())
        .then(email => {
          document.querySelector('#email-view').style.display = 'block';
          document.querySelector('#emails-view').style.display = 'none';
          document.querySelector('#compose-view').style.display = 'none';

          email_view = document.querySelector("#email-view");
          // Delete the previous mail in the email-view div
          email_view.innerHTML = "";

          const sender = document.createElement('div');
          sender.innerHTML = `<b>From:</b> ${email.sender}`;
          email_view.append(sender);

          const recipients_div = document.createElement('div');
          recipients_div.innerHTML = '<b>To: </b>';
          for (const recipient of email.recipients) {
            if (email.recipients.indexOf(recipient) === (email.recipients.length - 1)) {
              recipients_div.innerHTML += `${recipient}`;
            }
            else {
              recipients_div.innerHTML += `${recipient}, `;
            }
          }
          email_view.append(recipients_div);

          const subject = document.createElement('div');
          subject.innerHTML = `<b>Subject</b> ${email.subject}`;
          email_view.append(subject);

          const timestamp = document.createElement('div');
          timestamp.innerHTML = `<b>Timestamp</b> ${email.timestamp}`;
          email_view.append(timestamp);

          const current_user_email = document.querySelector("#user_email").innerHTML;
          // if current logged in user is not the sender of the email: show archive/unarchive btn
          if (current_user_email != email.sender) {
            const btn_container = document.createElement('div');
            btn_container.classList.add("btn-container");

            // Create reply btn
            const reply_btn = document.createElement("BUTTON");
            reply_btn.classList.add('btn','btn-outline-primary');
            reply_btn.innerHTML = "Reply";
            reply_btn.addEventListener('click', () => {
              compose_email();
              //Pre-fill the recipient field
              document.querySelector("#compose-recipients").value = email.sender;
              //Pre-fill the subject field
              const email_subject = document.querySelector("#compose-subject");
              if (email.subject.slice(0,3) === "Re:") {
                email_subject.value = email.subject;
              }
              else {
                email_subject.value = `Re: ${email.subject}`;
              }
              //Pre-fill the body field
              document.querySelector("#compose-body").value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`
            })

            btn_container.append(reply_btn);


            // Create archive or unarchive btn
            const archive_btn = document.createElement("BUTTON");
            archive_btn.classList.add('btn','btn-outline-primary', 'ml-2');
            archive_btn.setAttribute('id', 'archive-btn');
            if (email.archived === true) {
              archive_btn.innerHTML = "Unarchive";
              archive_btn.addEventListener('click', () => {
                fetch(`/emails/${email.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    archived: false 
                  })
                })
                .then(response => {
                  if (response.ok) {
                    load_mailbox('inbox')
                  }
                  else {
                    document.querySelector("#error_msg_container").innerHTML = "An error occured. Please try again."
                  }
                })
              })
            }
            else {
              archive_btn.innerHTML = "Archive";
              archive_btn.addEventListener('click', () => {
                fetch(`/emails/${email.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    archived: true
                  })
                })
                .then(response => {
                  if (response.ok){
                    load_mailbox('inbox')
                  }
                  else {
                    document.querySelector("#error_msg_container").innerHTML = "An error occured. Please try again."
                  }
                })
              })
            }
            btn_container.append(archive_btn);

            email_view.append(btn_container);
          }
          // if current logged in user is the sender: don't show an archive/unarchive btn
          else {
            const reply_btn = document.createElement("BUTTON");
            reply_btn.classList.add('btn','btn-outline-primary', 'mt-1');
            reply_btn.innerHTML = "Reply";
            reply_btn.addEventListener('click', () => {
              compose_email();
              //Pre-fill the recipient field
              document.querySelector("#compose-recipients").value = email.sender;
              //Pre-fill the subject field
              const email_subject = document.querySelector("#compose-subject");
              if (email.subject.slice(0,3) === "Re:") {
                email_subject.value = email.subject;
              }
              else {
                email_subject.value = `Re: ${email.subject}`;
              }
              //Pre-fill the body field
              document.querySelector("#compose-body").value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`
            })
            email_view.append(reply_btn);
          }

          horizontal_line = document.createElement("hr");
          email_view.append(horizontal_line);

          const body = document.createElement('div');
          body.innerHTML = email.body;
          email_view.append(body);
        })
      });
      document.querySelector('#emails-view').append(email_container);
    })

  });
};