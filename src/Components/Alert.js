import {useSelector} from "react-redux";
import {useEffect, useRef} from "react";
import {myEventsSelector} from "../store/selectors";
import config from "../config.json";

const Alert = () => {

    const chainId = useSelector(state => state.provider.chainId)
    const isPending = useSelector(state => state.exchange.transaction.isPending)
    const isError = useSelector(state => state.exchange.transaction.isError)
    const account = useSelector(state => state.provider.account)

    const events = useSelector(myEventsSelector)
    const alertRef = useRef(null)

    const removeHandler = async () => {
        alertRef.current.className = 'alert--remove'
    }

    useEffect(() => {
        if ((isPending || isError || events[0]) && account) {
            alertRef.current.className = 'alert'
        }
    }, [isPending,isError, account])

    return (
        <div>
            {isPending ? (
                <div className="alert alert--remove" onClick={removeHandler} ref={alertRef}>
                    <h1>Transaction Pending...</h1>
                </div>
            ) : isError ? (
                <div className="alert alert--remove" onClick={removeHandler} ref={alertRef}>
                    <h1>Transaction Will Fail.</h1>
                </div>
            ) : !isPending && events[0] ? (

                <div className="alert alert--remove" onClick={removeHandler} ref={alertRef}>
                    <h1>Transaction Successful</h1>
                    <a
                        href={config[chainId] ? `${config[chainId].exploreURL}/tx/${events[0].transactionHash}` : '#'}
                        target='_blank'
                        rel='noreferrer'
                    >
                        {events[0].transactionHash.slice(0,6) + '...' + events[0].transactionHash.slice(60,66)}
                    </a>
                </div>

            ) : (
                <div className="alert alert--remove" onClick={removeHandler} ref={alertRef}></div>

            )}

        </div>
    );
}

export default Alert;