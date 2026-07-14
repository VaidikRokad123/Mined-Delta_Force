import { useState, useRef, useEffect } from 'react'
import BillView from './BillView'

const VOICE_API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function ChatOrder({ sessionId }) {
  const INITIAL_MSG = { role: 'bot', text: 'Hi! I\'m your ordering assistant. Tell me what you\'d like to order, ask about the menu, or say "confirm" when you\'re done!' }
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [orderDone, setOrderDone] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState(null)
  const [confirmedOrderId, setConfirmedOrderId] = useState(null)
  const [confirmedTotal, setConfirmedTotal] = useState(null)
  const [showBill, setShowBill] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (overrideText) => {
    const text = (typeof overrideText === 'string' ? overrideText : input).trim()
    if (!text || sending) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setSending(true)

    try {
      const res = await fetch(`${VOICE_API}/parse-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text }),
      })
      const data = await res.json()

      // Build response messages
      const botMessages = []

      if (data.clarification) {
        botMessages.push({ role: 'bot', text: data.clarification })
      } else if (data.message) {
        botMessages.push({ role: 'bot', text: data.message })
      }

      if (data.upsell) {
        botMessages.push({ role: 'bot', text: data.upsell })
      }

      if (data.order) {
        setCurrentOrder(data.order)
        if (!data.clarification) {
          const items = (data.order.items || []).map(i => `${i.quantity}x ${i.name}`)
          const combos = (data.order.combos || []).map(c => `${c.quantity}x ${c.combo_name}`)
          const all = [...items, ...combos]
          if (all.length > 0 && !data.message) {
            botMessages.push({ role: 'bot', text: `Current order: ${all.join(', ')}` })
          }
        }
      }

      if (data.completed) {
        botMessages.push({ role: 'system', text: `Order confirmed! Order ID: ${data.order_id || 'N/A'} — Total: ₹${data.total || data.order?.final_price || ''}` })
        setOrderDone(true)
        setConfirmedOrder(data.order || null)
        setConfirmedOrderId(data.order_id || null)
        setConfirmedTotal(data.total || data.order?.final_price || null)
        setShowBill(true)
      }

      if (botMessages.length === 0) {
        botMessages.push({ role: 'bot', text: 'I got that. What else would you like?' })
      }

      setMessages(prev => [...prev, ...botMessages])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }])
    }

    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetOrder = () => {
    setMessages([INITIAL_MSG])
    setOrderDone(false)
    setConfirmedOrder(null)
    setConfirmedOrderId(null)
    setConfirmedTotal(null)
    setCurrentOrder(null)
    setShowBill(false)
  }



  return (
    <>
      <div className="page-header">
        <h2>AI Chat Ordering</h2>
        <p>Order food by chatting with our AI assistant</p>
      </div>

      <div className="chat-portal-layout">
        {/* Left Side: Chat Flow */}
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>



          <div className="chat-input-bar">
            {orderDone ? (
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                <button className="btn-save" onClick={() => setShowBill(true)} style={{ flex: 1 }}>
                  🧾 View Bill
                </button>
                <button className="btn-cancel" onClick={resetOrder} style={{ flex: 1 }}>
                  New Order
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your order..."
                  disabled={sending}
                />
                <button className="btn-save" onClick={() => sendMessage()} disabled={sending || !input.trim()}>
                  {sending ? '...' : 'Send'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Live Cart Summary (Desktop only) */}
        <div className="chat-live-cart-panel">
          <div className="chat-live-cart-title">
            <span>🛒 Live Cart</span>
            {currentOrder && (currentOrder.items?.length > 0 || currentOrder.combos?.length > 0) && (
              <span className="badge badge-success">Active</span>
            )}
          </div>

          <div className="chat-live-cart-items">
            {currentOrder && (currentOrder.items?.length > 0 || currentOrder.combos?.length > 0) ? (
              <>
                {(currentOrder.items || []).map((item, i) => (
                  <div className="chat-live-cart-item" key={i}>
                    <span>
                      <span className="qty">{item.quantity}x</span>
                      {item.name}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      ₹{item.base_price * item.quantity}
                    </span>
                  </div>
                ))}
                {(currentOrder.combos || []).map((c, i) => (
                  <div className="chat-live-cart-item" key={`c-${i}`}>
                    <span>
                      <span className="qty">{c.quantity}x</span>
                      {c.combo_name}
                      <span style={{ fontSize: 9, color: 'var(--positive)', marginLeft: 4 }}>(combo)</span>
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      ₹{c.combo_price * c.quantity}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0', fontSize: 12 }}>
                Your cart is empty.<br />Start talking to the bot to add items.
              </div>
            )}
          </div>

          {currentOrder && (currentOrder.items?.length > 0 || currentOrder.combos?.length > 0) && (
            <div className="chat-live-cart-total-box">
              <div className="chat-live-cart-total-line">
                <span>Total Amount</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  ₹{currentOrder.final_price || currentOrder.total_price}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showBill && (
        <BillView
          order={confirmedOrder}
          orderId={confirmedOrderId}
          total={confirmedTotal}
          onClose={() => setShowBill(false)}
        />
      )}
    </>
  )
}
