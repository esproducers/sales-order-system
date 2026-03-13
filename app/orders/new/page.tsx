'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getProductsAdmin } from '@/actions/products'
import { getClientsAdmin } from '@/actions/clients'
import { createOrderAdmin, getRecentOrdersAdmin } from '@/actions/orders'

export default function NewOrderPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemPrice, setItemPrice] = useState(0)
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [notes, setNotes] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [showRecentModal, setShowRecentModal] = useState(false)

  useEffect(() => {
    loadClients()
    loadProducts()
  }, [profile])

  useEffect(() => {
    if (selectedClient) loadRecentOrders()
  }, [selectedClient])

  const loadClients = async () => {
    if (!profile) return
    const { data, error } = await getClientsAdmin(profile.id)
    if (error) {
      console.error('Error loading clients:', error)
      return
    }
    setClients(data || [])
  }

  const loadProducts = async () => {
    const { data, error } = await getProductsAdmin()
    if (error) {
      console.error('Error loading products:', error)
      return
    }
    setProducts(data || [])
  }

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId)
    const product = products.find(p => p.id === productId)
    if (product) {
      setItemPrice(product.price_per_ctn)
    }
  }

  const addItem = () => {
    if (!selectedProduct) {
      toast.error('Select a product first')
      return
    }
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const existingItemIndex = items.findIndex(i => i.product_id === product.id)

    if (existingItemIndex > -1) {
      const newItems = [...items]
      newItems[existingItemIndex].quantity += itemQuantity
      // Update price in case agent adjusted it
      newItems[existingItemIndex].price = itemPrice
      setItems(newItems)
      toast.success(`Updated quantity for ${product.name}`)
    } else {
      setItems([...items, {
        product_id: product.id,
        item_name: product.name,
        quantity: itemQuantity,
        price: itemPrice
      }])
      toast.success('Added to order')
    }

    // Reset for next item
    setSelectedProduct('')
    setItemQuantity(1)
    setItemPrice(0)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const loadRecentOrders = async () => {
    if (!selectedClient) return
    const { data, error } = await getRecentOrdersAdmin(selectedClient)
    if (error) {
      console.error('Error loading recent orders:', error)
      return
    }
    const orders = data || []
    setRecentOrders(orders)
  }

  const addItemFromHistory = (productId: string, name: string, price: number) => {
    // If the product doesn't exist in the current products list (e.g., deleted), don't add
    const product = products.find(p => p.id === productId)
    if (!product) {
      toast.error('Product no longer available')
      return
    }

    const existingItemIndex = items.findIndex(i => i.product_id === productId)
    if (existingItemIndex > -1) {
      const newItems = [...items]
      newItems[existingItemIndex].quantity += 1
      setItems(newItems)
      toast.success(`Updated ${name} quantity (+1)`)
    } else {
      setItems([...items, {
        product_id: productId,
        item_name: name,
        quantity: 1,
        price: price
      }])
      toast.success(`Added ${name} to order`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) { toast.error('Please select a client'); return }
    if (items.length === 0) {
      toast.error('Add at least one item to the order')
      return
    }
    setLoading(true)
    try {
      const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
      const discount = promoApplied ? subTotal * 0.1 : 0

      const orderData = {
        client_id: selectedClient,
        agent_id: profile?.id,
        purchase_date: purchaseDate,
        total_amount: subTotal - discount,
        commission_amount: subTotal * ((profile?.commission_rate || 0) / 100),
        notes: notes,
        items: items, // Multi-item support
        item_name: items[0].item_name, // Fallback
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        price: items[0].price
      }

      const { error } = await createOrderAdmin(orderData)

      if (error) throw new Error(error)
      toast.success('Order created!')
      router.push('/orders')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  const discount = promoApplied ? subTotal * 0.1 : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 1580, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 32, color: '#111827' }}>
          New Order{' '}
          {items.length > 0 && (
            <span style={{ fontSize: '1.25rem', color: '#6b7280', fontWeight: 500, marginLeft: 12 }}>
              ({items.length} item{items.length > 1 ? 's' : ''})
            </span>
          )}
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedClient && recentOrders.length > 0 ? '420px 1fr 360px' : '1fr 360px',
          gap: 32,
          alignItems: 'flex-start',
        }}>

          {/* ────── Column 1: Client History (Left) ────── */}
          {selectedClient && recentOrders.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: 20, borderBottom: '2px solid var(--primary-light)', paddingBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                    Client History
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                    Last 5 orders for <strong style={{ color: 'var(--primary-dark)' }}>{clients.find(c => c.id === selectedClient)?.company_name}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {recentOrders.map((o) => {
                    const allHistoricalItems = recentOrders.flatMap(order => order.items || []);
                    const getFreq = (name: string) => allHistoricalItems.filter((i: any) => i.item_name === name).length;

                    return (
                      <div key={o.id} style={{
                        padding: 18,
                        background: '#fcfdfd',
                        borderRadius: 14,
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'transform 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e5e7eb', paddingBottom: 10 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '1.1rem' }}>📅</span> {new Date(o.purchase_date).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-dark)' }}>
                            RM {o.total_amount.toFixed(2)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(o.items || [{ item_name: o.item_name, quantity: o.quantity, price: o.price, product_id: '' }]).map((item: any, idx: number) => {
                            const frequency = getFreq(item.item_name);
                            return (
                              <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.88rem',
                                padding: '4px 0',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                  {frequency > 1 && <span style={{ fontSize: '0.9rem' }} title={`Ordered ${frequency} times recently`}>🔥</span>}
                                  <span style={{
                                    fontWeight: 600,
                                    color: '#374151',
                                    whiteSpace: 'normal',
                                    lineHeight: 1.3
                                  }}>
                                    {item.item_name}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 12 }}>
                                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                                    <div style={{ fontWeight: 800, color: '#6b7280', fontSize: '0.9rem' }}>x{item.quantity}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>RM {item.price.toFixed(2)} ea</div>
                                  </div>
                                  <button
                                    onClick={() => addItemFromHistory(item.product_id, item.item_name, item.price)}
                                    style={{
                                      background: 'var(--primary)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      width: 32,
                                      height: 32,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      fontSize: '1.4rem',
                                      fontWeight: 800,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                      transition: 'all 0.15s'
                                    }}
                                    title="Add to current order"
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ────── Column 2: Order Details (Center) ────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 24, marginTop: 0, color: '#111827' }}>Order Details</h2>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '1rem', marginBottom: 8, color: '#374151' }}>Client *</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: '1rem', outline: 'none', background: '#fff', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  required
                >
                  <option value="">— Select a client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '1rem', marginBottom: 8, color: '#374151' }}>Purchase Date *</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: '1rem', outline: 'none', background: '#fff' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  required
                />
              </div>

              <div style={{ background: '#f9fafb', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.3rem' }}>🛍️</span> Add Item to Order
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#4B5563' }}>Product</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => handleProductChange(e.target.value)}
                      style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: '1rem' }}
                    >
                      <option value="">Select product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#4B5563' }}>Price (RM/ctn)</label>
                    <input
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#4B5563' }}>Qty</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                        style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: '1rem', textAlign: 'center' }}
                      />
                      <button
                        type="button"
                        onClick={addItem}
                        style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 20px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(46,189,142,0.2)' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 20, marginTop: 0, color: '#111827' }}>Items in Current Order</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: '#fcfdfd', borderRadius: 14, border: '1px solid #f0f0f0' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{item.item_name}</div>
                        <div style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: 4 }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{item.quantity}</span> CTN × <span>RM {item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary-dark)' }}>RM {(item.quantity * item.price).toFixed(2)}</div>
                        <button
                          onClick={() => removeItem(idx)}
                          style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', marginBottom: 12, color: '#374151' }}>Order Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special requests, packaging instructions..."
                  rows={4}
                  style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 12, padding: '14px', fontSize: '0.95rem', resize: 'none', outline: 'none' }}
                />
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, border: '2px dashed #d1d5db' }}>
                <span style={{ fontSize: '2.5rem' }}>📄</span>
                <p style={{ fontSize: '0.95rem', color: '#6b7280', fontWeight: 500, margin: 0 }}>No payment receipt or document</p>
                <button type="button" style={{ padding: '10px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(46,189,142,0.15)' }}>📎 Upload Document</button>
              </div>
            </div>
          </div>

          {/* ────── Column 3: Order Summary (Right) ────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', position: 'sticky', top: 40 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 28, marginTop: 0, color: '#111827' }}>Order Summary</h2>

              <div style={{ border: '2px solid #f3f4f6', borderRadius: 14, padding: '20px 24px', marginBottom: 28, background: '#f9fafb' }}>
                <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: 10, fontWeight: 600 }}>Apply Promo Code</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="XYZ123"
                    disabled={promoApplied}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '12px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: 10,
                      fontSize: '1rem',
                      outline: 'none',
                      fontWeight: 700,
                      background: promoApplied ? '#f3f4f6' : '#fff'
                    }}
                  />
                  {!promoApplied ? (
                    <button
                      type="button"
                      onClick={() => { if (promoCode) setPromoApplied(true) }}
                      style={{
                        padding: '12px 24px',
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Apply
                    </button>
                  ) : (
                    <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.6rem', padding: '0 8px' }}>✓</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 600 }}>
                  <span style={{ color: '#6b7280' }}>Sub-Total</span>
                  <span style={{ color: '#111827' }}>RM {subTotal.toFixed(2)}</span>
                </div>
                {promoApplied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', color: 'var(--primary)', fontWeight: 700 }}>
                    <span>Promo Discount (10%)</span>
                    <span>−${discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 900, borderTop: '2px solid #f3f4f6', paddingTop: 20, color: '#111827' }}>
                  <span>Grand Total</span>
                  <span style={{ color: 'var(--primary-dark)' }}>RM {(subTotal - discount).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: loading ? '#9ca3af' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 20px rgba(46,189,142,0.3)',
                  transition: 'transform 0.2s, background 0.2s'
                }}
                onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loading ? 'PROCESSING...' : 'PLACE ORDER NOW'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                <span style={{ fontSize: '0.9rem', color: '#9ca3af', fontWeight: 600 }}>🔒 Secure Checkout</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
