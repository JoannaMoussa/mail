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
    .then(response => response.json())
    .then(result => {
      console.log(result);
    })
    load_mailbox('sent');
  });


  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //get the emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    emails.forEach((email) => {
      const email_container = document.createElement('div');
      email_container.setAttribute('id', 'email-container')

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