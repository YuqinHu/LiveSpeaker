async function set_sidebar() {
    var username, email, user_type

    var httpRequest = new XMLHttpRequest();//First: build object

    const url = `/get_email_name_type`
    httpRequest.open('GET', url, true);//Second: build connect
    httpRequest.send();//Third: sand request
    /**
     * Receive data and procuess
     */
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var json = httpRequest.responseText;//receive json
            let data = JSON.parse(json);

            username = data.name;
            email = data.email;
            user_type = data.type;


            document.getElementById("tool_bar_username").innerHTML = username;
            document.getElementById("tool_bar_email").innerHTML = email;

            if(user_type == "admin" || user_type == "superadmin"){
                // document.getElementById("sidebar_nav_user_management").style.display="";
                // // document.getElementById("sidebar_nav_session_management").style.display="";
                // document.getElementById("sidebar_nav_notes_management").style.display="";
                document.getElementById("sidebar_nav_management").style.display="";
            }


        }
    };
}

set_sidebar()