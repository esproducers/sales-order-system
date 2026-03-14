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
      const subTot = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
      const disc = promoApplied ? subTot * 0.1 : 0

      const orderData = {
        client_id: selectedClient,
        agent_id: profile?.id,
        purchase_date: purchaseDate,
        total_amount: subTot - disc,
        commission_amount: subTot * ((profile?.commission_rate || 0) / 100),
        notes: notes,
        items: items,
        item_name: items[0].item_name,
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-[1580px] w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        
        <h1 className="text-2xl md:text-[2.2rem] font-black mb-6 md:mb-8 text-gray-900 leading-tight">
          New Order{' '}
          {items.length > 0 && (
            <span className="text-lg md:text-xl text-gray-500 font-medium ml-2">
              ({items.length} item{items.length > 1 ? 's' : ''})
            </span>
          )}
        </h1>

        <div className={`flex flex-col lg:flex-row gap-6 md:gap-8 items-start`}>
          
          {/* Main Content Area (History + Forms) */}
          <div className="flex-1 w-full flex flex-col xl:flex-row gap-6 md:gap-8 min-w-0">
             
             {/* ────── Column 1: Client History (Left on XL) ────── */}
             {selectedClient && recentOrders.length > 0 && (
                <div className="w-full xl:w-[400px] shrink-0">
                   <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200">
                     <div className="mb-5 border-b-2 border-primary-light pb-3">
                       <h3 className="m-0 text-lg md:text-xl font-extrabold text-gray-900">Client History</h3>
                       <p className="m-0 mt-1 text-sm text-gray-500">
                          Last 5 orders for <strong className="text-primary-dark">{clients.find(c => c.id === selectedClient)?.company_name}</strong>
                       </p>
                     </div>

                     <div className="flex flex-col gap-4">
                       {recentOrders.map((o) => {
                          const allHistoricalItems = recentOrders.flatMap(order => order.items || []);
                          const getFreq = (name: string) => allHistoricalItems.filter((i: any) => i.item_name === name).length;

                          return (
                            <div key={o.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-3 shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-transform duration-200 hover:-translate-y-0.5">
                               <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-2">
                                  <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                                     <span className="text-base">📅</span> {new Date(o.purchase_date).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                  <span className="text-sm font-black text-primary-dark">
                                     RM {o.total_amount.toFixed(2)}
                                  </span>
                               </div>

                               <div className="flex flex-col gap-2.5">
                                  {(o.items || [{ item_name: o.item_name, quantity: o.quantity, price: o.price, product_id: '' }]).map((item: any, idx: number) => {
                                      const frequency = getFreq(item.item_name);
                                      return (
                                        <div key={idx} className="flex justify-between items-center text-sm py-1">
                                           <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                                              {frequency > 1 && <span className="text-sm shrink-0" title={`Ordered ${frequency} times recently`}>🔥</span>}
                                              <span className="font-semibold text-gray-700 leading-tight break-words">
                                                 {item.item_name}
                                              </span>
                                           </div>
                                           <div className="flex items-center gap-3 shrink-0">
                                              <div className="text-right min-w-[60px]">
                                                 <div className="font-extrabold text-gray-500 text-sm">x{item.quantity}</div>
                                                 <div className="text-[0.7rem] text-gray-400 font-bold leading-none mt-0.5">RM{item.price.toFixed(2)}ea</div>
                                              </div>
                                              <button
                                                 onClick={() => addItemFromHistory(item.product_id, item.item_name, item.price)}
                                                 className="w-8 h-8 md:w-9 md:h-9 bg-primary text-white border-none rounded-lg flex items-center justify-center cursor-pointer text-lg md:text-xl font-black shadow-sm transition-transform hover:scale-110 active:scale-95 shrink-0"
                                                 title="Add to current order"
                                              >
                                                  +
                                              </button>
                                           </div>
                                        </div>
                                      );
                                  })}
                               </div>
                            </div>
                          )
                       })}
                     </div>
                   </div>
                </div>
             )}

             {/* ────── Column 2: Order Details (Center) ────── */}
             <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
                 
                 {/* Main Form Box */}
                 <div className="bg-white rounded-2xl p-5 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200">
                    <h2 className="font-extrabold text-lg md:text-xl mb-6 mt-0 text-gray-900">Order Details</h2>

                    <div className="mb-5 md:mb-6">
                       <label className="block font-bold text-sm md:text-base mb-2 text-gray-700">Client *</label>
                       <select
                         value={selectedClient}
                         onChange={(e) => setSelectedClient(e.target.value)}
                         className="w-full p-3 md:p-3.5 border-2 border-gray-200 rounded-xl text-base outline-none bg-white transition-colors focus:border-primary"
                         required
                       >
                         <option value="">— Select a client —</option>
                         {clients.map((c) => (
                           <option key={c.id} value={c.id}>{c.company_name}</option>
                         ))}
                       </select>
                    </div>

                    <div className="mb-6 md:mb-8">
                       <label className="block font-bold text-sm md:text-base mb-2 text-gray-700">Purchase Date *</label>
                       <input
                         type="date"
                         value={purchaseDate}
                         onChange={(e) => setPurchaseDate(e.target.value)}
                         className="w-full p-3 md:p-3.5 border-2 border-gray-200 rounded-xl text-base outline-none bg-white transition-colors focus:border-primary"
                         required
                       />
                    </div>

                    {/* Add Item Box */}
                    <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-200">
                       <h3 className="text-base md:text-lg font-extrabold mb-4 md:mb-5 text-primary-dark flex items-center gap-2">
                           <span className="text-xl md:text-2xl">🛍️</span> Add Item to Order
                       </h3>
                       <div className="flex flex-col sm:flex-row gap-4">
                           <div className="flex-1">
                               <label className="block text-xs md:text-sm font-bold mb-1.5 text-gray-600">Product</label>
                               <select
                                 value={selectedProduct}
                                 onChange={(e) => handleProductChange(e.target.value)}
                                 className="w-full p-2.5 md:p-3 border-2 border-gray-200 rounded-xl text-sm md:text-base outline-none focus:border-primary bg-white"
                               >
                                 <option value="">Select product...</option>
                                 {products.map(p => (
                                   <option key={p.id} value={p.id}>{p.name}</option>
                                 ))}
                               </select>
                           </div>
                           <div className="flex gap-4 sm:max-w-[320px]">
                               <div className="flex-1 sm:w-28">
                                   <label className="block text-xs md:text-sm font-bold mb-1.5 text-gray-600">Price (RM/ctn)</label>
                                   <input
                                     type="number"
                                     value={itemPrice}
                                     onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                                     className="w-full p-2.5 md:p-3 border-2 border-gray-200 rounded-xl text-sm md:text-base outline-none focus:border-primary"
                                   />
                               </div>
                               <div className="flex-1 sm:w-24">
                                   <label className="block text-xs md:text-sm font-bold mb-1.5 text-gray-600">Qty</label>
                                   <div className="flex gap-2">
                                       <input
                                         type="number"
                                         value={itemQuantity}
                                         onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                                         className="w-full p-2.5 md:p-3 border-2 border-gray-200 rounded-xl text-sm md:text-base outline-none text-center focus:border-primary"
                                       />
                                   </div>
                               </div>
                           </div>
                       </div>
                       <button
                           type="button"
                           onClick={addItem}
                           className="w-full mt-4 bg-primary text-white border-none rounded-xl p-3 md:p-3.5 font-extrabold text-sm md:text-base cursor-pointer shadow-[0_4px_12px_rgba(46,189,142,0.2)] hover:bg-primary-dark transition-colors"
                       >
                           + Add to Cart
                       </button>
                    </div>
                 </div>

                 {/* Current Items Box */}
                 {items.length > 0 && (
                     <div className="bg-white rounded-2xl p-5 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200">
                         <h2 className="font-extrabold text-lg md:text-xl mb-4 md:mb-5 mt-0 text-gray-900">Items in Current Order</h2>
                         <div className="flex flex-col gap-3 md:gap-4">
                             {items.map((item, idx) => (
                                 <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 md:p-5 bg-gray-50 rounded-xl border border-gray-100 gap-3">
                                     <div className="flex-1">
                                         <div className="font-extrabold text-base md:text-lg text-gray-900 leading-tight">{item.item_name}</div>
                                         <div className="text-sm md:text-base text-gray-500 mt-1 font-medium">
                                             <span className="font-bold text-primary-dark">{item.quantity}</span> CTN × <span>RM {item.price.toFixed(2)}</span>
                                         </div>
                                     </div>
                                     <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 border-t border-gray-200 sm:border-none pt-3 sm:pt-0">
                                          <div className="font-black text-lg md:text-xl text-primary-dark">
                                              RM {(item.quantity * item.price).toFixed(2)}
                                          </div>
                                          <button
                                              onClick={() => removeItem(idx)}
                                              className="bg-red-100 text-red-600 border-none rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center cursor-pointer text-lg md:text-xl font-black hover:bg-red-200 transition-colors"
                                              title="Remove Item"
                                          >
                                              ×
                                          </button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {/* Notes & Upload */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200">
                         <label className="block font-bold text-sm md:text-base mb-3 text-gray-700">Order Notes</label>
                         <textarea
                             value={notes}
                             onChange={(e) => setNotes(e.target.value)}
                             placeholder="Special requests, packaging instructions..."
                             rows={4}
                             className="w-full border-2 border-gray-200 rounded-xl p-3.5 text-sm md:text-base outline-none resize-none focus:border-primary transition-colors"
                         />
                     </div>
                     <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 text-center">
                         <span className="text-4xl md:text-5xl opacity-80">📄</span>
                         <p className="text-sm md:text-base text-gray-500 font-semibold m-0">No payment receipt or document</p>
                         <button type="button" className="mt-2 px-5 py-2.5 bg-primary text-white border-none rounded-lg cursor-pointer font-bold text-sm shadow-[0_4px_12px_rgba(46,189,142,0.15)] hover:bg-primary-dark transition-colors">
                             📎 Upload Document
                         </button>
                     </div>
                 </div>

             </div>
          </div>

          {/* ────── Column 3: Order Summary (Right on LG Desktop) ────── */}
          <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0">
             <div className="bg-white rounded-2xl p-5 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-200 sticky top-[88px]">
                <h2 className="font-extrabold text-lg md:text-xl mb-5 md:mb-7 mt-0 text-gray-900">Order Summary</h2>

                <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-4 md:p-5 mb-6 md:mb-8">
                   <div className="text-[0.8rem] md:text-sm text-gray-600 mb-2 font-bold uppercase tracking-wider">Apply Promo Code</div>
                   <div className="flex gap-2">
                      <input
                         type="text"
                         value={promoCode}
                         onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                         placeholder="XYZ123"
                         disabled={promoApplied}
                         className={`flex-1 min-w-0 p-2.5 md:p-3 border-2 rounded-lg text-sm md:text-base outline-none font-bold transition-colors ${promoApplied ? 'bg-gray-100 border-gray-100' : 'bg-white border-gray-200 focus:border-primary'}`}
                      />
                      {!promoApplied ? (
                         <button
                           type="button"
                           onClick={() => { if (promoCode) setPromoApplied(true) }}
                           className="px-4 py-2.5 bg-primary text-white border-none rounded-lg font-extrabold text-sm hover:bg-primary-dark transition-colors"
                         >
                           Apply
                         </button>
                      ) : (
                         <div className="text-primary font-black text-2xl flex items-center justify-center px-3">✓</div>
                      )}
                   </div>
                </div>

                <div className="flex flex-col gap-3.5 mb-6 md:mb-8">
                   <div className="flex justify-between text-sm md:text-base font-bold text-gray-600">
                      <span>Sub-Total</span>
                      <span>RM {subTotal.toFixed(2)}</span>
                   </div>
                   {promoApplied && (
                      <div className="flex justify-between text-sm md:text-base font-bold text-primary">
                         <span>Promo Discount (10%)</span>
                         <span>−RM {discount.toFixed(2)}</span>
                      </div>
                   )}
                   <div className="flex justify-between text-xl md:text-2xl font-black border-t-2 border-gray-100 pt-4 mt-1 text-gray-900">
                      <span>Total</span>
                      <span className="text-primary-dark">RM {(subTotal - discount).toFixed(2)}</span>
                   </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-black text-base md:text-lg border-none shadow-[0_8px_20px_rgba(46,189,142,0.3)] transition-all ${loading ? 'bg-gray-400 text-white cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-primary-dark hover:-translate-y-0.5 cursor-pointer'}`}
                >
                  {loading ? 'PROCESSING...' : 'PLACE ORDER NOW'}
                </button>

                <div className="flex justify-center mt-4">
                   <span className="text-xs md:text-sm text-gray-400 font-bold tracking-wide">🔒 Secure Checkout</span>
                </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  )
}
