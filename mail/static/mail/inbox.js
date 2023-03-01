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
        document.getElementById(email.id.toString()).style.backgroundColor = "#cfd3d5";
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
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#mailbox-and-emailview-container").style.display = "none";

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


// This function is called when one of these buttons is clicked: inbox, sent, archived.
function load_mailbox(mailbox) {
  remove_messages();
  const selected_mail_view = document.querySelector("#selected-email-view"); 
  selected_mail_view.innerHTML = "";
  // Show just the mailbox-and-emailview-container
  document.querySelector('#mailbox-and-emailview-container').style.display = 'flex';
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
      email_container.classList.add("email-container", "d-flex", "flex-column", "border", "border-dark", "p-2");
      email_container.setAttribute("id", `${email.id}`);
      if (email.read) {
        email_container.style.backgroundColor = "#cfd3d5";
      }
      // Create sender+icons+timestamp container
      const sender_icon_timestamp_container = document.createElement('div');
      sender_icon_timestamp_container.classList.add('d-flex', 'justify-content-between');
      // Create sender container
      const sender_container = document.createElement('div');
      sender_container.classList.add("font-weight-bold", "mb-2");
      sender_container.innerHTML = email.sender_fullname;
      sender_icon_timestamp_container.append(sender_container);

      //Create icons+timestamp container
      const icon_timestamp_container = document.createElement('div');
      icon_timestamp_container.classList.add("d-flex");

      // Create timestamp container
      const timestamp_container = document.createElement('div');
      timestamp_container.innerHTML = email.timestamp.split(",")[0];
      icon_timestamp_container.append(timestamp_container);

      const icon_container = document.createElement('div');

      // Create the icons of the archive and read btn (the sent emails should not have read and archive icons)
      const current_user_email = document.querySelector("#user_email").innerHTML;
      if (current_user_email != email.sender) {
        // Create archive btn 
        const arch_icon = document.createElement('i');
        arch_icon.classList.add('action_btn', 'bi', 'bi-archive', 'mr-3');
        arch_icon.setAttribute("id", `arch_${email.id}`);
        if (email.archived) {
          arch_icon.setAttribute("title", "Unarchive")
        }
        else {
          arch_icon.setAttribute("title", "Archive")
        }
        // Add click event listener to the archive icon 
        arch_icon.addEventListener("click", (event) => {
          event.stopPropagation(); //to prevent the click event from bubbling, so the click event on the email container will not happen.
          mailbox_archive(email);
        })
        icon_container.append(arch_icon);
  
        // Create read/unread btn
        const read_icon = document.createElement('i');
        read_icon.classList.add("action_btn");
        read_icon.setAttribute("id", `read_${email.id}`);
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
        icon_container.append(read_icon);

        // Add mouseenter event listener to every email
        email_container.addEventListener("mouseenter", () => {
          timestamp_container.style.display = "none";
          icon_container.style.display = "block";
        })

        // Add mouseleave event listener to every email
        email_container.addEventListener("mouseleave", () => {
          timestamp_container.style.display = "block";
          icon_container.style.display = "none";
        })
      }
      icon_timestamp_container.append(icon_container);
      icon_container.style.display = "none";
      timestamp_container.style.display = "block";
      
      sender_icon_timestamp_container.append(icon_timestamp_container);
    
      email_container.append(sender_icon_timestamp_container);

      // Create subject container
      const subject_container = document.createElement('div');
      subject_container.classList.add("mb-2")
      subject_container.innerHTML = email.subject;
      email_container.append(subject_container);
      
      //Create container of the first few characters of the body
      const first_words_of_body = document.createElement('div');
      first_words_of_body.classList.add("font-weight-light", "body_truncation");
      first_words_of_body.innerHTML = email.body
      email_container.append(first_words_of_body);

      // Add a click event listener to every email
      email_container.addEventListener('click', () => {
        remove_messages();
        email_container.style.backgroundColor = "#cfd3d5";
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
          email_view = document.querySelector("#selected-email-view");
          // Delete the previous mail in the selected-email-view div
          email_view.innerHTML = "";

          // Create subject+archive btn container
          const subject_arch = document.createElement('div');
          subject_arch.classList.add("d-flex", "justify-content-between", "align-items-start", "mb-3");
          // Create subject container
          const subject = document.createElement('div');
          subject.classList.add("subject");
          subject.innerHTML = email.subject;
          subject_arch.append(subject);
          //Create archive btn
          // As mentioned in the project specifications, I shouldn't have archive/unarchive option in the Sent mailbox.
          // So I added this condition: 
          // if current logged in user is not the sender of the email: show archive/unarchive btn
          const current_user = document.querySelector("#user_email").innerHTML;
          if (current_user != email.sender) {
            const archive_btn = document.createElement("button");
            archive_btn.classList.add('btn','btn-outline-primary');
            if (email.archived === true) {
              archive_btn.innerHTML = "Unarchive";
              archive_btn.addEventListener('click', () => update_email_archive(email.id, false))
            }
            else {
              archive_btn.innerHTML = "Archive";
              archive_btn.addEventListener('click', () => update_email_archive(email.id, true))
            }
            subject_arch.append(archive_btn);
          }
          email_view.append(subject_arch);

          // Create icon+sender+recipient+timestamp container
          const icon_sender_recip_timestamp = document.createElement('div');
          icon_sender_recip_timestamp.classList.add("d-flex", "mb-3", "justify-content-start");
          // Create user icon 
          const user_icon = document.createElement('i');
          user_icon.classList.add("bi", "bi-person-circle", "user_icon", "mr-3", "d-flex", "justify-content-start");
          icon_sender_recip_timestamp.append(user_icon);
          // Create sender+recipient+timestamp container
          const sender_recip_timestamp = document.createElement('div');
          sender_recip_timestamp.classList.add("d-flex", "justify-content-between", "w-100");
          // Create sender+recipient container
          const sender_recipient = document.createElement('div');
          sender_recipient.classList.add("d-flex", "flex-column", "mr-5");
          // Create sender container
          const sender = document.createElement('div');
          sender.classList.add("d-flex");
          // Create sender username container
          const sender_username = document.createElement('div');
          sender_username.classList.add("mr-2");
          sender_username.innerHTML = email.sender_fullname;
          sender.append(sender_username);
          // Create sender email container
          const sender_email = document.createElement('div');
          sender_email.classList.add("font-weight-light");
          sender_email.innerHTML = `(${email.sender})`;
          sender.append(sender_email);

          sender_recipient.append(sender);
          // Create recipient container
          const recipients_div = document.createElement('div');
          recipients_div.innerHTML = "<b>To: </b>";
          for (const recipient of email.recipients) {
            if (email.recipients.indexOf(recipient) === (email.recipients.length - 1)) {
              recipients_div.innerHTML += `${recipient}`;
            }
            else {
              recipients_div.innerHTML += `${recipient}, `;
            }
          }
          sender_recipient.append(recipients_div);
          sender_recip_timestamp.append(sender_recipient);
          // Create timestamp container
          const timestamp = document.createElement('div');
          timestamp.classList.add("font-weight-light", "text-nowrap");
          timestamp.innerHTML = email.timestamp;
          sender_recip_timestamp.append(timestamp);

          icon_sender_recip_timestamp.append(sender_recip_timestamp);

          email_view.append(icon_sender_recip_timestamp);

          // Create body container
          const body = document.createElement('div');
          body.classList.add("mb-4");
          body.innerHTML = email.body.replace(/\n/g, "<br>");
          email_view.append(body);

          // Create reply btn
            const reply_btn = document.createElement("button");
            reply_btn.classList.add('btn','btn-outline-primary', 'reply_btn');
            reply_btn.innerHTML = "Reply";
            reply_btn.addEventListener('click', () => reply_btn_click(email))
            email_view.append(reply_btn);
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