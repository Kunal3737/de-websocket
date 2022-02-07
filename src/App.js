import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

var socket = new WebSocket("wss://production-esocket.delta.exchange");

const App = () => {
  const [data, setData] = useState([]);
  const [symbols, setSymbols] = useState([]);

  const getInitialData = () => {
    axios
      .get("https://api.delta.exchange/v2/products")
      .then(async (res) => {
        let filteredData = [];
        let symbols = [];
        let data = res.data.result;
        data.forEach((item) => {
          filteredData.push({
            symbol: item.symbol,
            description: item.description,
            underlying_asset: item.underlying_asset.symbol,
            mark_price: "",
          });
          symbols.push(item.symbol);
        });

        await setData(filteredData);
        await setSymbols(symbols);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (symbols.length) {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          payload: {
            channels: [
              {
                name: "v2/ticker",
                symbols: symbols,
              },
            ],
          },
        })
      );
    }
  }, [symbols]);

  const onMessageHandler = (event) => {
    const msg = JSON.parse(event.data);
    setData((currentData) => {
      let updatedData = currentData;
      updatedData.forEach((item, i) => {
        if (item.symbol === msg.symbol) {
          updatedData[i] = {
            symbol: item.symbol,
            description: item.description,
            underlying_asset: item.underlying_asset,
            mark_price: msg.mark_price,
          };
        }
      });
      return [...updatedData];
    });
  };

  const onOpenHandler = (event) => {
    console.log("socket", socket);
    console.log("Websocket connection established!");
  };

  const onCloseHandler = (event) => {
    console.log("Socket connection closed");
  };

  const onErrorHandler = (event) => {
    console.log(event);
    console.log("Something went wrong!");
  };

  useEffect(() => {
    getInitialData();
    socket.addEventListener("message", (event) => {
      onMessageHandler(event);
    });
    socket.addEventListener("open", (event) => {
      onOpenHandler(event);
    });
    socket.addEventListener("close", (event) => {
      onCloseHandler(event);
    });
    socket.addEventListener("error", (event) => {
      onErrorHandler(event);
    });

    return () => {
      socket.removeEventListener("message", (event) => {
        onMessageHandler(event);
      });
      socket.removeEventListener("open", (event) => {
        onOpenHandler(event);
      });
      socket.removeEventListener("close", (event) => {
        onCloseHandler(event);
      });
      socket.removeEventListener("error", (event) => {
        onErrorHandler(event);
      });
    };
  }, []);

  return (
    <div>
      <table>
        <tr className="table-header">
          <th>Symbol</th>
          <th>Description</th>
          <th>Underlying Asset</th>
          <th className="mark-price">Mark Price</th>
        </tr>
        {data &&
          data.map((item) => (
            <tr key={item.symbol}>
              <td>{item.symbol}</td>
              <td>{item.description}</td>
              <td>{item.underlying_asset}</td>
              <td className="mark-price">{item.mark_price}</td>
            </tr>
          ))}
      </table>
    </div>
  );
};

export default App;
