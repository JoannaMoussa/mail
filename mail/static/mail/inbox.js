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

      document.querySelector('#emails-view').append(email_container);
    })

  });
};