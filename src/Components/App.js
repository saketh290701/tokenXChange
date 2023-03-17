import { useEffect } from "react";
import {useDispatch} from "react-redux";
import {
    loadProvider,
    loadNetwork,
    loadAccount,
    loadTokens,
    loadExchange,
    subscriberToEvents, loadAllOrders
} from "../store/interactions";
import config from "../config.json";
import Navbar from "./Navbar";
import Markets from "./Markets";
import Balance from "./Balance";
import Order from "./Order";
import OrderBook from "./OrderBook";
import PriceChart from "./PriceChart";
import Trades from "./Trades";
import Transactions from "./Transactions";
import Alert from "./Alert";

function App() {
    const dispatch = useDispatch()

    const loadBlockchainData = async () =>{

        // connect ethers to blockchain
        const provider = loadProvider(dispatch)
        const chainId = await loadNetwork(provider, dispatch)

        // reload page when network changes
        window.ethereum.on('chainChanged', () =>{
            // console.log('changed')
            window.location.reload()
        })

        // fetch current network's chainId (e.g hardhat: 31337, kovan: 42) & when account changed
        window.ethereum.on('accountsChanged', ()=>{
            loadAccount(provider, dispatch)
        })
        // await loadAccount(provider, dispatch)

        // token smart Contract
        const  dApp = config[chainId].dApp.address
        const  mETH = config[chainId].mETH.address
        await loadTokens(provider, [dApp,mETH], dispatch)

        const  exchangeConfig = config[chainId].exchange.address
        const  exchange = await loadExchange(provider, exchangeConfig, dispatch)

        subscriberToEvents(exchange, dispatch)

        loadAllOrders(provider, exchange, dispatch)
    }

    useEffect(()=>{
        loadBlockchainData()
    })

    return (
        <div>

            <Navbar />

            <main className='exchange grid'>
                <section className='exchange__section--left grid'>

                    <Markets />

                    <Balance />

                    <Order />

                </section>
                <section className='exchange__section--right grid'>

                    <PriceChart />

                    <Transactions />

                    <Trades />

                    <OrderBook />

                </section>
            </main>

            <Alert />

        </div>
    );
}

export default App;
