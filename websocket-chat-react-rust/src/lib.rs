// lib.rs
use std::{
    sync::{Arc},
    collections::HashMap
};
use axum::{
    http::StatusCode,
    extract::{
        ws::{Message, WebSocket},
        WebSocketUpgrade, Path,  
    },

    response::{IntoResponse},
    routing::get,
    Extension, Router,
};

use futures::{SinkExt, StreamExt};
use shuttle_service::ShuttleAxum;
use sync_wrapper::SyncWrapper;
use tokio::{
    sync::{mpsc::{self, UnboundedSender, UnboundedReceiver}, RwLock},

};
use serde::{Deserialize, Serialize};

type Users = Arc<RwLock<HashMap<usize, UnboundedSender<Message>>>>;
static NEXT_USERID: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(1);

#[shuttle_service::main]
async fn main() -> ShuttleAxum {
    let users = Users::default();

    let router = Router::new()
        .route("/ws", get(ws_handler))
        .layer(Extension(users));

    let sync_wrapper = SyncWrapper::new(router);

    Ok(sync_wrapper)
}


#[derive(Serialize, Deserialize)]
struct Msg {
    name: String,
    uid: Option<usize>,
    message: String,
}

async fn ws_handler(ws: WebSocketUpgrade, Extension(state): Extension<Users>) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(stream: WebSocket, state: Users) {
    // By splitting we can send and receive at the same time.
    let my_id = NEXT_USERID.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    let (mut sender, mut receiver) = stream.split();

    let (tx, mut rx): (UnboundedSender<Message>, UnboundedReceiver<Message>) = mpsc::unbounded_channel();

        // If a message has been received, send the message (expect on error)
    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            sender.send(msg).await.expect("Error while sending message");
        }
        sender.close().await.unwrap();
    });

    state.write().await.insert(my_id, tx);

    while let Some(Ok(result)) = receiver.next().await {
        println!("{:?}", result);
        if let Ok(result) = enrich_result(result, my_id) {
            broadcast_msg(result, &state).await;
        }
    }

    // This client disconnected
    disconnect(my_id, &state).await;
}

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

async fn broadcast_msg(msg: Message, users: &Users) {
    if let Message::Text(msg) = msg {
        for (&_uid, tx) in users.read().await.iter() {
            tx.send(Message::Text(msg.clone()))
                .expect("Failed to send Message")
        }
    }
}

async fn disconnect_user(
    Path(user_id): Path<usize>,
    Extension(users): Extension<Users>,
) -> impl IntoResponse {
    disconnect(user_id, &users).await;
    "Done"
}

async fn disconnect(my_id: usize, users: &Users) {
    println!("Good bye user {}", my_id);
    users.write().await.remove(&my_id);
    println!("Disconnected {my_id}");
}

async fn handle_error(err: std::io::Error) -> impl IntoResponse {
    (StatusCode::INTERNAL_SERVER_ERROR, format!("{:?}", err))
}