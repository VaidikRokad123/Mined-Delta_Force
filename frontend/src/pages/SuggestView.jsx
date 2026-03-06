import { useState, useEffect } from 'react'

export default function SuggestView({ apiBase }) {
    const [products, setProducts] = useState([])
    const [selectedId, setSelectedId] = useState(null)
    const [suggestions, setSuggestions] = useState(null)
    const [loading, setLoading] = useState(true)
    const [suggestLoading, setSuggestLoading] = useState(false)

    // Manual combo creation
    const [pickedItems, setPickedItems] = useState(new Set())
    const [modalOpen, setModalOpen] = useState(false)
    const [comboForm, setComboForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        fetch(`${apiBase}/combo/analytics/products`)
            .then(r => r.json())
            .then(d => {
                if (d.success) setProducts(d.data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [apiBase])

    const handleSelect = async (productId) => {
        setSelectedId(productId)
        setSuggestLoading(true)
        setSuggestions(null)
        setPickedItems(new Set())
        try {
            const res = await fetch(`${apiBase}/combo/suggest/${productId}`)
            const data = await res.json()
            if (data.success) setSuggestions(data)
        } catch (e) {
            console.error(e)
        }
        setSuggestLoading(false)
    }

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    // Toggle picking an item for combo
    const togglePick = (productId) => {
        setPickedItems(prev => {
            const next = new Set(prev)
            if (next.has(productId)) next.delete(productId)
            else next.add(productId)
            return next
        })
    }

    // Open the combo creation modal
    const openCreateCombo = () => {
        if (!suggestions) return

        // Build items list: base product + all picked suggestions
        const baseProduct = suggestions.product
        const allItems = [
            { product_id: baseProduct._id, name: baseProduct.name, quantity: 1, base_price: baseProduct.selling_price }
        ]

        for (const s of suggestions.individual_suggestions) {
            if (pickedItems.has(s.product_id)) {
                allItems.push({ product_id: s.product_id, name: s.name, quantity: 1, base_price: s.selling_price })
            }
        }

        const totalSelling = allItems.reduce((sum, i) => sum + i.base_price, 0)
        const discount = Math.round(totalSelling * 0.10)
        const comboPrice = totalSelling - discount

        setComboForm({
            combo_name: allItems.map(i => i.name.split(' ')[0]).join(' + ') + ' Combo',
            description: `Custom combo: ${allItems.map(i => i.name).join(' + ')}`,
            items: allItems,
            total_selling_price: totalSelling,
            combo_price: comboPrice,
            discount: discount,
            total_cost: 0,
            combo_score: 0,
            rating: 0,
        })
        setModalOpen(true)
    }

    const handleFormChange = (field, value) => {
        setComboForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSaveCombo = async () => {
        if (!comboForm) return
        setSaving(true)
        try {
            const res = await fetch(`${apiBase}/combo/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    combo_name: comboForm.combo_name,
                    description: comboForm.description,
                    items: comboForm.items,
                    total_selling_price: Number(comboForm.total_selling_price),
                    combo_price: Number(comboForm.combo_price),
                    discount: Number(comboForm.discount),
                    total_cost: Number(comboForm.total_cost),
                    combo_score: Number(comboForm.combo_score),
                    rating: Number(comboForm.rating),
                }),
            })
            const result = await res.json()
            if (result.success) {
                showToast(`"${comboForm.combo_name}" saved to database!`)
                setModalOpen(false)
                setPickedItems(new Set())
            } else {
                showToast(result.message || 'Failed to save', 'error')
            }
        } catch (e) {
            showToast('Network error: ' + e.message, 'error')
        }
        setSaving(false)
    }

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading menu…</p></div>

    const selectedProduct = products.find(p => p.product_id === selectedId)
    const pickedCount = pickedItems.size

    return (
        <>
            <div className="page-header">
                <h2>💡 Upsell Suggestions</h2>
                <p>Select a product to see what customers usually order with it</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Select a Product</h3>
                    <span className="badge badge-success">{products.length} items</span>
                </div>
                <div className="product-select-grid">
                    {products.map(p => (
                        <button
                            key={p.product_id}
                            className={`product-select-btn ${selectedId === p.product_id ? 'selected' : ''}`}
                            onClick={() => handleSelect(p.product_id)}
                        >
                            {p.name}
                            <span className="product-cat">{p.category} · ₹{p.selling_price}</span>
                        </button>
                    ))}
                </div>
            </div>

            {suggestLoading && (
                <div className="loading"><div className="spinner"></div><p>Finding suggestions for {selectedProduct?.name}…</p></div>
            )}

            {suggestions && (
                <>
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-label">Selected Product</div>
                            <div className="stat-value" style={{ fontSize: 20 }}>{suggestions.product.name}</div>
                            <div className="stat-sub">₹{suggestions.product.selling_price} · {suggestions.product.category}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Orders Analyzed</div>
                            <div className="stat-value">{suggestions.total_orders_analyzed}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Orders with this item</div>
                            <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{suggestions.orders_containing_product}</div>
                            <div className="stat-sub">{((suggestions.orders_containing_product / suggestions.total_orders_analyzed) * 100).toFixed(1)}% of all orders</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Suggestions Found</div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>{suggestions.individual_suggestions.length}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="card">
                            <div className="card-header">
                                <h3>🛒 Individual Suggestions</h3>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {pickedCount > 0 && (
                                        <button className="btn-add" style={{ width: 'auto', padding: '6px 14px' }} onClick={openCreateCombo}>
                                            ✨ Create Combo ({pickedCount} + {suggestions.product.name.split(' ')[0]})
                                        </button>
                                    )}
                                    <span className="badge badge-success">Top {suggestions.individual_suggestions.length}</span>
                                </div>
                            </div>

                            {pickedCount > 0 && (
                                <div style={{
                                    padding: '10px 14px', marginBottom: 12, borderRadius: 'var(--radius-sm)',
                                    background: 'var(--accent-bg)', border: '1px solid var(--border-active)',
                                    fontSize: 13, color: 'var(--accent-light)'
                                }}>
                                    📦 <strong>{suggestions.product.name}</strong> + {
                                        suggestions.individual_suggestions
                                            .filter(s => pickedItems.has(s.product_id))
                                            .map(s => s.name).join(' + ')
                                    }
                                </div>
                            )}

                            {suggestions.individual_suggestions.length === 0 ? (
                                <div className="empty-state"><p>No individual suggestions found</p></div>
                            ) : (
                                suggestions.individual_suggestions.map((s, i) => {
                                    const isPicked = pickedItems.has(s.product_id)
                                    return (
                                        <div
                                            className="suggestion-item"
                                            key={i}
                                            style={{
                                                flexDirection: 'column', alignItems: 'stretch', gap: 8,
                                                borderColor: isPicked ? 'var(--accent)' : undefined,
                                                background: isPicked ? 'var(--accent-bg)' : undefined,
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {/* Checkbox */}
                                                <button
                                                    onClick={() => togglePick(s.product_id)}
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 6, border: `2px solid ${isPicked ? 'var(--accent)' : 'var(--border)'}`,
                                                        background: isPicked ? 'var(--accent)' : 'transparent', color: 'white',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 14, flexShrink: 0, transition: 'var(--transition)'
                                                    }}
                                                >
                                                    {isPicked ? '✓' : ''}
                                                </button>

                                                <div className="suggestion-rank">{i + 1}</div>
                                                <div className="suggestion-info" style={{ flex: 1 }}>
                                                    <h4>{s.name} <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>₹{s.selling_price} · {s.category}</span></h4>
                                                    <div className="reason" style={{ fontWeight: 500 }}>{s.reason}</div>
                                                </div>
                                                <div className="suggestion-score">
                                                    <div className="score-val">{(s.upsell_score * 100).toFixed(0)}</div>
                                                    <div className="score-label">score</div>
                                                </div>
                                            </div>

                                            {/* Insight Tags */}
                                            {s.insight_tags && s.insight_tags.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {s.insight_tags.map((tag, t) => (
                                                        <span key={t} style={{
                                                            fontSize: 10, padding: '3px 8px', borderRadius: 4,
                                                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                                                            background: tag.includes('Margin') ? (tag.includes('High') ? 'var(--success-bg)' : tag.includes('Good') ? 'var(--star-bg)' : 'var(--trap-bg)')
                                                                : tag.includes('Strong') ? 'var(--gem-bg)' : 'var(--accent-bg)',
                                                            color: tag.includes('Margin') ? (tag.includes('High') ? 'var(--success)' : tag.includes('Good') ? 'var(--star)' : 'var(--trap)')
                                                                : tag.includes('Strong') ? 'var(--gem)' : 'var(--accent-light)',
                                                        }}>{tag}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Detailed Insight */}
                                            {s.insight && (
                                                <div style={{
                                                    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                                                    padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                                                    borderLeft: '3px solid var(--accent)'
                                                }}>
                                                    {s.insight}
                                                </div>
                                            )}

                                            {/* Quick Stats */}
                                            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                                                <span>📊 Conf: {(s.confidence * 100).toFixed(1)}%</span>
                                                <span>📈 Lift: {s.lift}</span>
                                                <span>🤝 Compat: {s.compatibility}</span>
                                                <span>💰 Profit: ₹{s.profit_per_unit || '—'}/unit</span>
                                                <span>🛒 Bought together: {s.times_bought_together}x</span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3>🎯 Combo Suggestions</h3>
                                <span className="badge badge-gem">{suggestions.combo_suggestions.length} combos</span>
                            </div>
                            {suggestions.combo_suggestions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📦</div>
                                    <p>No saved combos contain this product yet.<br />Use the Smart Combos tab to generate new ones!</p>
                                </div>
                            ) : (
                                suggestions.combo_suggestions.map((c, i) => (
                                    <div className="combo-card" key={i} style={{ marginBottom: 12 }}>
                                        <h4>{c.combo_name}</h4>
                                        <div className="combo-items">
                                            {c.items.map((item, j) => (
                                                <span className="combo-item-tag" key={j}>
                                                    {item.name} (₹{item.base_price})
                                                </span>
                                            ))}
                                        </div>
                                        <div className="combo-price-row">
                                            <span className="combo-discount">Save ₹{c.discount}</span>
                                            <span className="combo-final-price">₹{c.combo_price}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ─── CREATE COMBO MODAL ─────────────────────────────── */}
            {modalOpen && comboForm && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Manual Combo</h3>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Combo Name</label>
                                <input type="text" value={comboForm.combo_name} onChange={e => handleFormChange('combo_name', e.target.value)} />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={comboForm.description}
                                    onChange={e => handleFormChange('description', e.target.value)}
                                    rows={2}
                                    style={{
                                        width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border)', background: 'var(--bg-card)',
                                        color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Combo Price (₹)</label>
                                    <input type="number" value={comboForm.combo_price} onChange={e => handleFormChange('combo_price', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Original Price (₹)</label>
                                    <input type="number" value={comboForm.total_selling_price} onChange={e => handleFormChange('total_selling_price', e.target.value)} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Discount (₹)</label>
                                    <input type="number" value={comboForm.discount} onChange={e => handleFormChange('discount', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Rating (0-5)</label>
                                    <input type="number" step="0.1" min="0" max="5" value={comboForm.rating} onChange={e => handleFormChange('rating', e.target.value)} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Items in Combo</label>
                                <div className="modal-items-list">
                                    {comboForm.items.map((item, i) => (
                                        <div className="modal-item" key={i}>
                                            <span className="modal-item-name">{item.name}</span>
                                            <span className="modal-item-price">₹{item.base_price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleSaveCombo} disabled={saving}>
                                {saving ? 'Saving…' : '💾 Save to Database'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TOAST ─────────────────────────────────────────── */}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
                </div>
            )}
        </>
    )
}
