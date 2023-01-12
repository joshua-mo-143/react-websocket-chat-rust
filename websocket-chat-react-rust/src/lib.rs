// dependencies
use std::{
    sync::{Arc},
    collections::HashMap, path::PathBuf
};
use axum::{
    http::StatusCode,
    extract::{
        ws::{Message, WebSocket},
        WebSocketUpgrade, Path,  
    },

    response::{IntoResponse},
    routing::{get},
    Extension, Router,
};

use axum_extra::routing::SpaRouter;
use futures::{SinkExt, StreamExt};
use shuttle_secrets::SecretStore;
use shuttle_service::ShuttleAxum;
use sync_wrapper::SyncWrapper;
use tokio::{
    sync::{mpsc::{self, UnboundedSender, UnboundedReceiver}, RwLock},

};
use serde::{Deserialize, Serialize};
use tower_http::{auth::RequireAuthorizationLayer};

// The list of users needs to be a hashmap that can be shared safely across threads, hence an Arc with RwLock
type Users = Arc<RwLock<HashMap<usize, UnboundedSender<Message>>>>;
static NEXT_USERID: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(1);

#[derive(Serialize, Deserialize)]
struct Msg {
    name: String,
    uid: Option<usize>,
    message: String,
}


#[shuttle_service::main]
async fn main(
    #[shuttle_secrets::Secrets] secrets: SecretStore,
    #[shuttle_static_folder::StaticFolder] static_folder: PathBuf
) -> ShuttleAxum {

    // We use Secrets.toml to set the BEARER key, just like in a .env file and call it here
    let secret = secrets.get("BEARER").unwrap_or("Bear".to_string());

    // set up router with Secrets & use syncwrapper to make the web service work
    let router = router(secret, static_folder);
    let sync_wrapper = SyncWrapper::new(router);

    Ok(sync_wrapper)
}

fn router(secret: String, static_folder: PathBuf) -> Router {
    // initialise the Users k/v store and allow the static files to be served
    let users = Users::default();

    // make an admin route for kicking users
    let admin = Router::new()
    .route("/disconnect/:user_id", get(disconnect_user))
    .layer(RequireAuthorizationLayer::bearer(&secret));

    let static_assets = SpaRouter::new("/", static_folder)
        .index_file("index.html").handle_error(handle_error);
    // return a new router and nest the admin route into the websocket route
     Router::new()
        .route("/ws", get(ws_handler))
        .nest("/admin", admin)
        .layer(Extension(users))
        .merge(static_assets)
}

async fn ws_handler(ws: WebSocketUpgrade, Extension(state): Extension<Users>) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(stream: WebSocket, state: Users) {
    // When a new user enters the chat (opens the websocket connection), assign them a user ID
    let my_id = NEXT_USERID.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    // By splitting the websocket into a receiver and sender, we can send and receive at the same time.
    let (mut sender, mut receiver) = stream.split();

    // Create a new channel for async task management
    let (tx, mut rx): (UnboundedSender<Message>, UnboundedReceiver<Message>) = mpsc::unbounded_channel();

    // If a message has been received, send the message (expect on error)
    tokio::spawn(async move {
        // If a message has been received, send a message
        while let Some(msg) = rx.recv().await {
            sender.send(msg).await.expect("Error while sending message");
        }
        sender.close().await.unwrap();
    });

    // insert the message into the HashMap - locks the Arc value to allow writing
    state.write().await.insert(my_id, tx);

    // if there's a message and the message is OK, broadcast it along all available open websocket connections
    while let Some(Ok(result)) = receiver.next().await {
        println!("{:?}", result);
        if let Ok(result) = enrich_result(result, my_id) {
            broadcast_msg(result, &state).await;
        }
    }

    // This client disconnected
    disconnect(my_id, &state).await;
}

// If the message is a websocket message and no errors, return it - else, return Ok(result)
// which is required by the server to be able to broadcast the message
fn enrich_result(result: Message, id: usize) -> Result<Message, serde_json::Error> {
    match result {
        Message::Text(msg) => {
            let mut msg: Msg = serde_json::from_str(&msg)?;
            msg.uid = Some(id);
            let msg = serde_json::to_string(&msg)?;
            Ok(Message::Text(msg))
        }
        _ => Ok(result),
    }
}

// Send received websocket message out to all open available WS connections
async fn broadcast_msg(msg: Message, users: &Users) {
    if let Message::Text(msg) = msg {
        for (&_uid, tx) in users.read().await.iter() {
            tx.send(Message::Text(msg.clone()))
                .expect("Failed to send Message")
        }
    }
}

// Disconnect a user manually - this is for admin purposes, eg if someone is being offensive in the chat
// you will want to be able to kick them out
async fn disconnect_user(
    Path(user_id): Path<usize>,
    Extension(users): Extension<Users>,
) -> impl IntoResponse {
    disconnect(user_id, &users).await;
    "Done"
}

// triggered when any user disconnects
async fn disconnect(my_id: usize, users: &Users) {
    println!("Good bye user {}", my_id);
    users.write().await.remove(&my_id);
    println!("Disconnected {my_id}");
}

// handle internal server errors
async fn handle_error(err: std::io::Error) -> impl IntoResponse {
    (StatusCode::INTERNAL_SERVER_ERROR, format!("{:?}", err))
}