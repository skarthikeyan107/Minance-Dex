/* global BigInt */
import React, { useEffect, useState } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import { ArrowDownOutlined, DownOutlined, SettingOutlined } from "@ant-design/icons";
import { useSendTransaction, useWaitForTransaction } from "wagmi";
import tokenList from "../tokenList.json";
import axios from "axios";

function Swap({ address, isConnected }) {
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState("");
  const [tokenTwoAmount, setTokenTwoAmount] = useState("");
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [txDetails, setTxDetails] = useState({});
  const [prices, setPrices] = useState(null);
  const [swapClickCount, setSwapClickCount] = useState(0);
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  const { data, sendTransaction } = useSendTransaction({
    request: {
      to: txDetails?.to,
      data: txDetails?.data,
      value: txDetails?.value,
    },
  });

  useWaitForTransaction({
    hash: data?.hash,
    onSuccess() {
      message.success("Transaction confirmed");
    },
    onError() {
      message.error("Transaction failed");
    },
  });

  const handleSlippageChange = (e) => {
    setSlippage(e.target.value);
  };

  const changeAmount = (e) => {
    setTokenOneAmount(e.target.value);
    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2));
    } else {
      setTokenTwoAmount("");
    }
  };

  const switchTokens = () => {
    const t1 = tokenOne;
    const t2 = tokenTwo;
    setTokenOne(t2);
    setTokenTwo(t1);
    setTokenOneAmount("");
    setTokenTwoAmount("");
    fetchPrices(t2.address, t1.address);
  };

  const openModal = (asset) => {
    setChangeToken(asset);
    setIsOpen(true);
  };

  const modifyToken = (i) => {
    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
    } else {
      setTokenTwo(tokenList[i]);
    }
    setIsOpen(false);
    fetchPrices(
      changeToken === 1 ? tokenList[i].address : tokenOne.address,
      changeToken === 2 ? tokenList[i].address : tokenTwo.address
    );
  };

  const fetchPrices = async (one, two) => {
    setIsPriceLoading(true);
    try {
      const res = await axios.get('https://minance-1.onrender.com/tokenPrice', {
  params: { addressOne: one, addressTwo: two }
});
      setPrices(res.data);
    } catch (error) {
      console.error("Failed to fetch prices:", error);
      setPrices(null);
    } finally {
      setIsPriceLoading(false);
    }
  };

  const fetchSwapTx = async () => {
    setSwapClickCount((prev) => prev + 1);
    if (!tokenOneAmount || !isConnected) return;

    try {
  const res = await axios.get("https://minance-1.onrender.com/tokenPrice", {
    params: {
      addressOne: tokenOne.address,
      addressTwo: tokenTwo.address,
      amount: tokenOneAmount,
      slippage
    }
  });

      setTxDetails({
        to: res.data.to,
        data: res.data.data,
        value: res.data.value,
      });

      sendTransaction();
    } catch (error) {
      console.error("Failed to fetch swap transaction:", error);

      const messages = [
        "Bro… this is a memecoin, why so serious? 🤣",
        "You really thought this would work? 💀",
        "Certified degen detected. Keep clicking, nothing’s happening. 🫡",
        "At this point… you’re farming disappointment. Respect. 😂"
      ];

      const index = Math.min(swapClickCount, messages.length - 1);
      message.error(messages[index]);
    }
  };

  useEffect(() => {
    fetchPrices(tokenList[0].address, tokenList[1].address);
  }, []);

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <Radio.Group value={slippage} onChange={handleSlippageChange}>
        <Radio.Button value={0.5}>0.5%</Radio.Button>
        <Radio.Button value={2.5}>2.5%</Radio.Button>
        <Radio.Button value={5}>5%</Radio.Button>
      </Radio.Group>
    </>
  );

  return (
    <>
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a Token"
      >
        <div className="modalContent">
          {tokenList.map((e, i) => (
            <div className="tokenChoice" key={i} onClick={() => modifyToken(i)}>
              <img src={e.img} alt={e.ticker} className="tokenLogo" />
              <div className="tokenChoiceNames">
                <div className="tokenName">{e.name}</div>
                <div className="tokenTicker">{e.ticker}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover content={settings} title="Settings" trigger="click" placement="bottomRight">
            <SettingOutlined className="cog" />
          </Popover>
        </div>

        {isPriceLoading ? (
          <div style={{ textAlign: "center", margin: "30px 0", fontWeight: "bold" }}>
            Fetching price… 🕐
          </div>
        ) : (
          <>
            <div className="inputs">
              <Input placeholder="0.0" value={tokenOneAmount} onChange={changeAmount} />
              <Input placeholder="0.0" value={tokenTwoAmount} disabled />
              <div className="switchButton" onClick={switchTokens}>
                <ArrowDownOutlined className="switchArrow" />
              </div>
              <div className="assetOne" onClick={() => openModal(1)}>
                <img src={tokenOne.img} className="assetLogo" alt="assetOneLogo" />
                {tokenOne.ticker} <DownOutlined />
              </div>
              <div className="assetTwo" onClick={() => openModal(2)}>
                <img src={tokenTwo.img} className="assetLogo" alt="assetTwoLogo" />
                {tokenTwo.ticker} <DownOutlined />
              </div>
            </div>

            <div
  className={`swapButton ${!isConnected || !tokenOneAmount ? "disabled" : ""}`}
  onClick={() => {

if (!isConnected) {
  message.error(
    <span>
      Connect your MetaMask wallet!{" "}
      <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
        Install MetaMask
      </a>
    </span>
  );
  return;
}

    if (!tokenOneAmount) {
      message.error("Enter an amount");
      return;
    }
    fetchSwapTx();
  }}
  style={{
    pointerEvents: "auto",
    opacity: !isConnected || !tokenOneAmount ? 0.5 : 1,
    cursor: "pointer"
  }}
>
  Swap
</div>
          </>
        )}
      </div>
    </>
  );
}

export default Swap;
