// For front end javascript, "require" does not work, and it is suggested for ethers library to be imported manually here 
// by copying the whole library yourself into a file. 
// https://docs.ethers.org/v5/single-page/#/v5/getting-started/
import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const withdrawButton = document.getElementById("withdrawButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
connectButton.onclick = connect
withdrawButton.onclick = withdraw
fundButton.onclick = fund
balanceButton.onclick = getBalance

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await ethereum.request({ method: "eth_requestAccounts" })
    } catch (error) {
      console.log(error)
    }
    connectButton.innerHTML = "Connected"
    const accounts = await ethereum.request({ method: "eth_accounts" })
    console.log(accounts)
  } else {
    connectButton.innerHTML = "Please install MetaMask"
  }
}

async function withdraw() {
  console.log(`Withdrawing...`)
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.withdraw()
      await listenForTransactionMine(transactionResponse, provider)
      // await transactionResponse.wait(1)
    } catch (error) {
      console.log(error)
    }
  } else {
    withdrawButton.innerHTML = "Please install MetaMask"
  }
}
// Note: If the transaction on metamask fails with nonce error, reset the account on metamask settings -> Advanced ->reset account
async function fund() {
  const ethAmount = document.getElementById("ethAmount").value
  console.log(`Funding with ${ethAmount}...`)
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      })
      await listenForTransactionMine(transactionResponse, provider)
    } catch (error) {
      console.log(error)
    }
  } else {
    fundButton.innerHTML = "Please install MetaMask"
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    //https://docs.ethers.org/v5/api/providers/other/#Web3Provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const balance = await provider.getBalance(contractAddress)
      console.log(ethers.utils.formatEther(balance))
    } catch (error) {
      console.log(error)
    }
  } else {
    balanceButton.innerHTML = "Please install MetaMask"
  }
}

function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}`)
    // without the promise here, the provider.once will kickoff another process (event) in parallel
    // and will  not wait for it to finish. The promise will only return when it is either resolved or rejected. 
    return new Promise((resolve, reject) => {
        try {
            // TODO: how did we get the transactionReceipt
            /* transaction.wait( [ confirms = 1 ] ) ⇒ Promise< TransactionReceipt >
                Resolves to the TransactionReceipt once the transaction has been included in the chain 
                for confirms blocks. If confirms is 0, and the transaction has not been mined, null is returned
            */
           //https://docs.ethers.org/v5/api/providers/provider/#Provider--event-methods 
            provider.once(transactionResponse.hash, (transactionReceipt) => {
                //console.log( ` transaction receipt : ${transactionReceipt}`)
                console.log(
                    `Completed with ${transactionReceipt.confirmations} confirmations. `
                )
                resolve()
            })
        } catch (error) {
            reject(error)
        }
    })
}