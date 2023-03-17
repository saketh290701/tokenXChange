import config from '../config.json'
import {useSelector} from 'react-redux'
import {loadTokens} from "../store/interactions";
import {useDispatch} from "react-redux";

const Markets = () => {

    const chainId = useSelector(state => state.provider.chainId)
    const provider = useSelector(state => state.provider.connection)

    const dispatch = useDispatch()

    const marketHandler = async (e) => {
        await loadTokens(provider, (e.target.value).split(','), dispatch)
    }

    return (
        <div className='component exchange__markets'>
            <p className='text--sm'>*Created by Bipin Parmar by following DApp University's Bootcamp2.0 course</p>

            <div className='component__header'>
                <h2>Select market</h2>

            </div>

            {chainId ? (
                <select name="markets" id='markets' onChange={marketHandler}>
                    <option
                        value={`${config[chainId].dApp.address},${config[chainId].mETH.address}`}>dApp/mETH
                    </option>
                    <option
                        value={`${config[chainId].dApp.address},${config[chainId].mDai.address}`}>dApp/mDAI
                    </option>
                </select>

            ) : (
                <div>Not Deployed to Network</div>
            )}


            <hr/>
        </div>
    )
}

export default Markets;