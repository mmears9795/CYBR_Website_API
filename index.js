import fetch from 'node-fetch';
import Web3 from 'web3';
import dotenv from 'dotenv';

const getInfoInterval = setInterval (async function () {
    try {
        let [CYBRPrice, CYBRETHPrice] = await getCYBRPrice();

        let ETHPrice = await getETHPrice();

        let poolCYBR = await getCYBRPoolTokens();

        let poolWETH = await getWethPoolTokens();

        let liquidity = await getLiquidity(poolCYBR, CYBRPrice, poolWETH, ETHPrice);

        let burn = await getBurnAmount();

        let TMC = await getTMC(burn, CYBRPrice);

        let TxandHolders = await getTxandHolders();

        let botsBanned = await getBlacklistAmount();

        let circSupply = await getCircSupply();

        let tokensReceived = await getTokensReceived();

        let tokensInWallet = await getTokensInWallet();

        let txCount = TxandHolders.txCount;

        let holdersCount = TxandHolders.holdersCount;

        let tokensSpent = tokensReceived - tokensInWallet;

        let poolCYBRformatter = Intl.NumberFormat('en', { notation: 'compact', maximumSignificantDigits: 6, });

        let poolBurnFormatter = Intl.NumberFormat('en', { notation: 'compact', maximumSignificantDigits: 4, });

        let circSupplyFormatter = Intl.NumberFormat('en', { notation: 'compact', maximumSignificantDigits: 4, });

        let formatCircSupply = circSupplyFormatter.format(circSupply);

        poolCYBR = poolCYBRformatter.format(poolCYBR);

        burn = poolBurnFormatter.format(burn);

        tokensInWallet = circSupplyFormatter.format(tokensInWallet);

        tokensReceived = circSupplyFormatter.format(tokensReceived);

        tokensSpent = circSupplyFormatter.format(tokensSpent);

        async function postData() {

            const apiKey = process.env.API_KEY;

            const url = 'https://thecyberapi.com/post_info.php?apiKey=' + apiKey + 
            "&usdPrice=" + CYBRPrice + 
            "&ethPrice=" + CYBRETHPrice + 
            "&totalLiquidity=" + liquidity + 
            "&pooledWeth=" + parseFloat(poolWETH).toFixed(2) +
            "&pooledCybr=" + poolCYBR + 
            "&transactions=" + txCount +
            "&holders=" + holdersCount +
            "&dilutedMarketCap=" + TMC + 
            "&burnedAmount=" + burn + 
            "&botsBanned=" + botsBanned +
            "&circulatingSupply=" + circSupply +
            "&formatedCirculatingSupply=" + formatCircSupply +
            "&donatedTokens=" + tokensReceived +
            "&donatedTokensSpent=" + tokensSpent +
            "&donatedTokensInWallet=" + tokensInWallet;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                },
            });

            return response.json();
        }    

        let postResponse = await postData();

        console.log(postResponse);

    } catch(error) {
        console.log(error);
    }
}, 5000)

async function getWethPoolTokens() {
    try {
        const infuraURL = process.env.INFURA_URL;
        const web3 = new Web3(infuraURL);

        const checkAddress1 = '0x4BbD1dDc2DEd3C287B74DBf3C2E500631DE4bf50';

        const checkAddress2 = '0xdfbed670c0fb5e84dd7faebbe67505808d3bea67'

        const WETHcontract = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

        const wethABI = [{
            "constant": true,
            "inputs": [
              {
                "name": "",
                "type": "address"
              }
            ],
            "name": "balanceOf",
            "outputs": [
              {
                "name": "",
                "type": "uint256"
              }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
          }]

          let contract = new web3.eth.Contract(wethABI, WETHcontract);

          let poolWETHv3 = await contract.methods.balanceOf(checkAddress1).call();

          let poolWETHv2 = await contract.methods.balanceOf(checkAddress2).call();

          poolWETHv3 = web3.utils.fromWei(poolWETHv3, "ether");

          poolWETHv2 = web3.utils.fromWei(poolWETHv2, "ether");

          let poolWETH = parseFloat(poolWETHv3) + parseFloat(poolWETHv2);

          return poolWETH;
    } catch(error) {
        getWethPoolTokens();
    }
}

async function getCYBRPoolTokens() {
    try {
        const infuraURL = process.env.INFURA_URL;
        const web3 = new Web3(infuraURL);

        const CYBRcontract = '0x438a6E42813118548C065336844239b63ad4Fcfd';

        const cyberABI = [{
            "inputs": [
              {
                "internalType": "address",
                "name": "account",
                "type": "address"
              }
            ],
            "name": "balanceOf",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }];

        const checkAddress1 = '0x4BbD1dDc2DEd3C287B74DBf3C2E500631DE4bf50';

        const checkAddress2 = '0xdfbed670c0fb5e84dd7faebbe67505808d3bea67'

        let contract = new web3.eth.Contract(cyberABI, CYBRcontract);

        let poolCYBR1 = await contract.methods.balanceOf(checkAddress1).call();

        let poolCYBR2 = await contract.methods.balanceOf(checkAddress2).call();

        poolCYBR1 = Math.round(poolCYBR1 / (10**18)).toFixed(0);

        poolCYBR2 = Math.round(poolCYBR2 / (10**19)).toFixed(0);

        let poolCYBR = parseInt(poolCYBR1) + parseInt(poolCYBR2);

        return poolCYBR;

    } catch(error) {
        getCYBRPoolTokens();
    }
}

async function getETHPrice() {
    try {
        const url = process.env.CG_URL;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            }
        });

        const data = await response.json();

        return data.ethereum.usd;
    } catch(error) {
        getETHPrice();
    }
}

async function getCYBRPrice() {
    try {
    const url = process.env.MORALIS_URL;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'X-API-Key': process.env.MORALIS_API_KEY,
        }
    });
    const data = await response.json();
    let ethPrice = (data.nativePrice.value / (10**18)).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 16 });
    let tempUSDPrice = (data.usdPrice);

    let usdPriceString = tempUSDPrice.toString();

    tempUSDPrice = usdPriceString.split('e-');

    let usdPrice = (tempUSDPrice[0] / (10**tempUSDPrice[1])).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 13 });
    //console.log("ethPrice " + ethPrice);
    return [usdPrice, ethPrice];
    } catch(error) {
        getCYBRPrice();
    }
}

async function getLiquidity(poolCYBR, CYBRPrice, poolWETH, ETHPrice) {
    try {
        // console.log(poolCYBR);

        // console.log(CYBRPrice);

        // console.log(poolWETH);

        // console.log(ETHPrice);

        let liquidity = (poolCYBR * CYBRPrice + poolWETH * ETHPrice);

        liquidity = liquidity.toFixed(2);

        liquidity = liquidity.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        return liquidity;
    } catch (error) {
        console.log(error);
    }
}

async function getTMC(burn, CYBRPrice) {
    try {
        // burn = Math.round(burn / (10**18));
    
        const totalSupply = 1000000000000000;
    
        let cybrTMC = (totalSupply - burn) * CYBRPrice;
    
        cybrTMC = cybrTMC.toFixed(2);
    
        cybrTMC = cybrTMC.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
        return (cybrTMC);
    } catch(error) {
        getTMC(burn, CYBRPrice);
    }
}

async function getBurnAmount() {
    try {
        const infuraURL = process.env.INFURA_URL;
        const web3 = new Web3(infuraURL);
    
        const cybrContract = '0x438a6E42813118548C065336844239b63ad4Fcfd';
    
        const cybrABI = [{
            "inputs": [],
            "name": "showBurnAmount",
            "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
            ],
            "stateMutability": "view",
            "type": "function"
        }];
    
        const contract = new web3.eth.Contract(cybrABI, cybrContract);
    
        let burn = await contract.methods.showBurnAmount().call();
    
        burn = Math.round(burn / (10**18)).toFixed(0);
    
        return burn;
    } catch(error) {
        getBurnAmount();
    }
}

async function getTxandHolders() {
    try {
        var apiLink = process.env.ETHPLOR_API;

        const response = await fetch(apiLink);

        const data = await response.json();

        let txCount = data.countOps;

        let holdersCount = data.holdersCount;

        return {txCount, holdersCount};
    } catch(error) {
        getTxandHolders();
    }
}

async function getBlacklistAmount() {
    try {
        const infuraURL = process.env.INFURA_URL;
        const web3 = new Web3(infuraURL);

        const CYBRcontract = '0x438a6E42813118548C065336844239b63ad4Fcfd';

        let blacklistABI = [{
            "inputs": [],
            "name": "showBlacklist",
            "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
            ],
            "stateMutability": "view",
            "type": "function"
        }];

        let contract = new web3.eth.Contract(blacklistABI, CYBRcontract);

        let blacklistedArray = await contract.methods.showBlacklist().call();

        return blacklistedArray.length;
    } catch(error) {
        console.log(error);
        getBlacklistAmount();
    }
}

async function getCircSupply() {
    try {
        const infuraURL = process.env.INFURA_URL;
        const web3 = new Web3(infuraURL);

        const CYBRcontract = '0x438a6E42813118548C065336844239b63ad4Fcfd';

        let circSupplyABI = [{
            "inputs": [],
            "name": "showCirculatingSupply",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }];

        let contract = new web3.eth.Contract(circSupplyABI, CYBRcontract);

        let circSupply = await contract.methods.showCirculatingSupply().call();

        circSupply = Math.round(circSupply / (10**18)).toFixed(0);

        return circSupply;
    } catch(error) {
        console.log(error);
        getCircSupply();
    }
}

async function getTokensReceived() {
    try {
        const infuraURL = process.env.INFURA_URL;
        const web3 = new Web3(infuraURL);

        const CYBRcontract = '0x438a6E42813118548C065336844239b63ad4Fcfd';

        let tokensReceivedABI = [{
            "inputs": [],
            "name": "showTokensReceivedTotal",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }];

        let contract = new web3.eth.Contract(tokensReceivedABI, CYBRcontract);

        let tokensReceived = await contract.methods.showTokensReceivedTotal().call();

        tokensReceived = Math.round(tokensReceived / (10**18));

        return tokensReceived;
    } catch(error) {
        console.log(error);
        getTokensReceived();
    }
}

async function getTokensInWallet() {
    try {
        const infuraURL = process.env.INFURA_URL;
        const web3 = new Web3(infuraURL);

        const CYBRcontract = '0x438a6E42813118548C065336844239b63ad4Fcfd';

        let tokensReceivedABI = [{
            "inputs": [],
            "name": "showTokensInsideDonationWallets",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }];

        let contract = new web3.eth.Contract(tokensReceivedABI, CYBRcontract);

        let tokensInWallet = await contract.methods.showTokensInsideDonationWallets().call();

        tokensInWallet = Math.round(tokensInWallet / (10**18));

        return tokensInWallet;
    } catch(error) {
        console.log(error);
        getTokensSpent();
    }
}