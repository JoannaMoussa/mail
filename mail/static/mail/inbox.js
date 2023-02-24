document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //send email
  document.querySelector('#submit_btn').addEventListener('click', (event) => {
    // Usually when a form is submitted, the url specified in the action attribute is loaded.
    // However, when there's no action specified for the form, the same page will be reloaded by default.
    // And in our case, when the page is reloaded, the event listener on the DOMContentLoaded event will  be triggered
    // and the inbox will be loaded. To prevent the page from reloading, we write this: 
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
        return response.ok ? json.message : Promise.reject(json.error);
      });
    })
    .then((success_msg) => {
      load_mailbox('sent');
      const success_div = document.createElement('div');
      success_div.classList.add('alert','alert-success');
      success_div.setAttribute('role', 'alert');
      success_div.innerHTML = success_msg;
      document.querySelector('#msg_container').append(success_div);

    })
    .catch(error_msg => {
      create_error_msg(error_msg)
    })
  });

  // By default, load the inbox
  load_mailbox('inbox');
});


// This function creates an error message div with bootstrap classes for styling.
function create_error_msg(error_msg){
  const error_div = document.createElement('div');
  error_div.classList.add('alert','alert-danger');
  error_div.setAttribute('role', 'alert');
  error_div.innerHTML = error_msg;
  document.querySelector('#msg_container').append(error_div);
}


// This function sends a put request to the /emails/${email_id} API, to set "archived" to true or false.
function update_email_archive(email_id, is_archived) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: is_archived 
    })
  })
  .then(response => {
    if (response.ok) {
      load_mailbox('inbox')
    }
    else {
      response.json().then(result => {
        create_error_msg(result.error)
      })
    }
  })
}


// This function is called when the archive btn in the mailbox is clicked
// When it's clicked, the email.archived will be set to true, and the email div will be deleted from the mailbox
function mailbox_archive(email) {
  let put_archived;
  if (email.archived) {
    put_archived = false
  }
  else {
    put_archived = true
  }
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: put_archived 
    })
  })
  .then(response => {
    if (response.ok) {
      // disable the click on the archive icon, read icon and on the email container
      let archive_icon = document.getElementById(`arch_${email.id}`);
      let read_icon = document.getElementById(`read_${email.id}`);
      let email_div = document.getElementById(email.id.toString());
      archive_icon.style.pointerEvents = 'none';
      read_icon.style.pointerEvents = 'none';
      email_div.style.pointerEvents = 'none';
      // Run the animation on the email container and then remove the email container
      email_div.style.animationPlayState = 'running';
      email_div.addEventListener('animationend', () => {
        email_div.remove()
      });
    }
    else {
      response.json().then(result => {
        create_error_msg(result.error)
      })
    }
  })
}


// This function is called when the read button in the mailbox is clicked
function read_icon_click(email) {
  let was_read = email.read;
  
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: !was_read
    })
  })
  .then(response => {
    if (response.ok) {
      email.read = !was_read;
      const readIcon = document.getElementById(`read_${email.id}`);
      if (was_read){
        document.getElementById(email.id.toString()).style.backgroundColor = "white";
        readIcon.classList.remove("bi-envelope-open");
        readIcon.classList.add("bi-envelope");
        readIcon.setAttribute("title", "Mark as read");
      }
      else{
        document.getElementById(email.id.toString()).style.backgroundColor = "lightgrey";
        readIcon.classList.remove("bi-envelope");
        readIcon.classList.add("bi-envelope-open");
        readIcon.setAttribute("title", "Mark as unread");
      }
    }
    else {
      response.json().then(result => {
        create_error_msg(result.error)
      })
    } 
  })
}


// This function empties the #msg_container div
function remove_messages() {
  return document.querySelector('#msg_container').innerHTML = "";
}


// This function is called when the reply btn is clicked.
function reply_btn_click(email) {
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
  let modified_body = email.body.replace(/^/gm, ">");
  document.querySelector("#compose-body").value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n${modified_body}`
}


// This function is called when the compose btn is clicked.
function compose_email() {
  remove_messages();
  // Show compose view and hide other views
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


// This function is called when one of these buttons is clicked: inbox, sent, archived.
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
  .then(response => {
    return response.json().then(json => {
      return response.ok ? json : Promise.reject(json.error);
    })
  })
  .then(emails => {
    emails.forEach((email) => {
      // Create email container
      const email_container = document.createElement('div');
      email_container.classList.add("email-container", "d-flex", "justify-content-between", "border", "border-dark", "p-3");
      email_container.setAttribute("id", `${email.id}`);
      if (email.read) {
        email_container.style.backgroundColor = "lightgrey";
      }
      // Create left container
      const left_container = document.createElement('div');
      left_container.classList.add('d-flex', 'justify-content-between')
      // Create sender container
      const sender_container = document.createElement('div');
      sender_container.classList.add("font-weight-bold", "ml-2", "mr-3")
      sender_container.innerHTML = email.sender;
      // Create subject container
      const subject_container = document.createElement('div');
      subject_container.innerHTML = email.subject;

      left_container.append(sender_container);
      left_container.append(subject_container);
      email_container.append(left_container);
      // Create right container
      const right_container = document.createElement('div');
      right_container.classList.add("d-flex", "font-weight-light", "mr-2");
      // Create timestamp container
      const timestamp_container = document.createElement('div');
      timestamp_container.innerHTML = email.timestamp;
      right_container.append(timestamp_container);
      // Create the container of the archive and read btn (the sent emails should not have read and archive btns)
      const current_user_email = document.querySelector("#user_email").innerHTML;
      if (current_user_email != email.sender) {
        // Create the container of the action btns
        const arch_read_container = document.createElement('div');
        arch_read_container.classList.add("d-flex", "ml-3");
        // Create archive btn 
        const arch_icon = document.createElement('i');
        arch_icon.classList.add("action_btn");
        arch_icon.setAttribute("id", `arch_${email.id}`);
        if (email.archived) {
          arch_icon.setAttribute("title", "Unarchive")
        }
        else {
          arch_icon.setAttribute("title", "Archive")
        }
        arch_icon.classList.add('arch_icon', 'bi', 'bi-archive', 'mr-3');
        // Add click event listener to the archive icon 
        arch_icon.addEventListener("click", (event) => {
          event.stopPropagation(); //to prevent the click event from bubbling, so the click event on the email container will not happen.
          mailbox_archive(email);
        })
  
        arch_read_container.append(arch_icon);
  
        // Create read/unread btn
        const read_icon = document.createElement('i');
        read_icon.setAttribute("id", `read_${email.id}`);
        read_icon.classList.add("action_btn");
        if (email.read) {
          read_icon.classList.add("bi", "bi-envelope-open");
          read_icon.setAttribute("title", "Mark as unread");
        }
        else {
          read_icon.classList.add("bi", "bi-envelope");
          read_icon.setAttribute("title", "Mark as read");
        }
        // Add click event listener on the read/unread icon
        read_icon.addEventListener("click", (event) => {
          event.stopPropagation();
          read_icon_click(email);
        })
  
        arch_read_container.append(read_icon);
        
        right_container.append(arch_read_container);
      }

      email_container.append(right_container);

      // Add a click event listener to every email
      email_container.addEventListener('click', () => {
        remove_messages();
        // Mark the message as read
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
        .then(response => {
          if (! response.ok) {
            response.json().then(result => {
              create_error_msg(result.error)
            })
          } 
        })
        //Get email details
        fetch(`/emails/${email.id}`)
        .then(response => {
          return response.json().then(json => {
            return response.ok ? json : Promise.reject(json.error);
          })
        })
        .then(email => {
          document.querySelector('#email-view').style.display = 'block';
          document.querySelector('#emails-view').style.display = 'none';
          document.querySelector('#compose-view').style.display = 'none';

          email_view = document.querySelector("#email-view");
          // Delete the previous mail in the email-view div
          email_view.innerHTML = "";

          // Get email sender
          const sender = document.createElement('div');
          sender.innerHTML = `<b>From:</b> ${email.sender}`;
          email_view.append(sender);

          // Get email recepients
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

          // Get email subject
          const subject = document.createElement('div');
          subject.innerHTML = `<b>Subject: </b> ${email.subject}`;
          email_view.append(subject);

          // Get email timestamp
          const timestamp = document.createElement('div');
          timestamp.innerHTML = `<b>Timestamp: </b> ${email.timestamp}`;
          email_view.append(timestamp);

          const current_user_email = document.querySelector("#user_email").innerHTML;
          // As mentioned in the project specifications, I shouldn't have archive/unarchive option in the Sent mailbox.
          // So I added this condition: 
          // if current logged in user is not the sender of the email: show archive/unarchive btn
          if (current_user_email != email.sender) {
            // Create a container for the reply and archive/unarchive btn
            const btn_container = document.createElement('div');
            btn_container.classList.add("d-flex", "mt-2");

            // Create reply btn
            const reply_btn = document.createElement("BUTTON");
            reply_btn.classList.add('btn','btn-outline-primary');
            reply_btn.innerHTML = "Reply";
            reply_btn.addEventListener('click', () => reply_btn_click(email))

            btn_container.append(reply_btn);

            // Create archive or unarchive btn
            const archive_btn = document.createElement("BUTTON");
            archive_btn.classList.add('btn','btn-outline-primary', 'ml-2');
            archive_btn.setAttribute('id', 'archive-btn');
            if (email.archived === true) {
              archive_btn.innerHTML = "Unarchive";
              archive_btn.addEventListener('click', () => update_email_archive(email.id, false))
            }
            else {
              archive_btn.innerHTML = "Archive";
              archive_btn.addEventListener('click', () => update_email_archive(email.id, true))
            }
            btn_container.append(archive_btn);

            email_view.append(btn_container);
          }
          // if current logged in user is the sender: don't create an archive/unarchive btn
          // just create the reply btn
          else {
            const reply_btn = document.createElement("BUTTON");
            reply_btn.classList.add('btn','btn-outline-primary', 'mt-1');
            reply_btn.innerHTML = "Reply";
            reply_btn.addEventListener('click', () => reply_btn_click(email))
            email_view.append(reply_btn);
          }

          horizontal_line = document.createElement("hr");
          email_view.append(horizontal_line);

          // Get email body
          const body = document.createElement('div');
          body.innerHTML = email.body.replace(/\n/g, "<br>");
          email_view.append(body);
        })
        // catch for the fetch(`/emails/${email.id}`)
        .catch(error_msg => {
          create_error_msg(error_msg)
        })
      });
      document.querySelector('#emails-view').append(email_container);
    })
  })
  // catch for the fetch(`/emails/${mailbox}`)
  .catch(error_msg => {
    create_error_msg(error_msg)
    })
};