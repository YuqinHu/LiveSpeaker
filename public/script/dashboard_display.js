async function set_dashboard_display() {
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


            if(user_type == "admin" || user_type == "superadmin"){
                document.getElementById("card_management").style.display="";

            }


        }
    };
}

set_dashboard_display()