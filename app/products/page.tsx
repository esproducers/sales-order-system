'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'
import {
    getProductsAdmin,
    createProductAdmin,
    updateProductAdmin,
    deleteProductAdmin
} from '@/actions/products'

interface Product {
    id: string
    name: string
    photo_url: string
    units_per_ctn: number
    price_per_ctn: number
    created_at: string
}

export default function ProductsPage() {
    const { profile } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        units_per_ctn: 1,
        price_per_ctn: 0,
        photo_url: '',
    })
    const [productFile, setProductFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)

    const isAdmin = profile?.role === 'admin'

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            setLoading(true)
            const { data, error } = await getProductsAdmin()
            if (error) throw new Error(error)
            setProducts(data || [])
        } catch (err: any) {
            toast.error('Failed to load products: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product)
            setFormData({
                name: product.name,
                units_per_ctn: product.units_per_ctn,
                price_per_ctn: product.price_per_ctn,
                photo_url: product.photo_url,
            })
        } else {
            setEditingProduct(null)
            setFormData({
                name: '',
                units_per_ctn: 1,
                price_per_ctn: 0,
                photo_url: '',
            })
        }
        setProductFile(null)
        setShowModal(true)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                toast.error('Please upload a JPG or PNG image')
                return
            }
            if (file.size > 2 * 1024 * 1024) {
                toast.error('File size must be less than 2MB')
                return
            }
            setProductFile(file)
        }
    }

    const uploadProductPhoto = async (): Promise<string | null> => {
        if (!productFile) return null
        try {
            const fileExt = productFile.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('product-photos').upload(fileName, productFile)
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('product-photos').getPublicUrl(fileName)
            return publicUrl
        } catch (error: any) {
            toast.error('Failed to upload photo')
            return null
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) return toast.error('Product name is required')
        if (formData.price_per_ctn <= 0) return toast.error('Price must be greater than 0')
        if (formData.units_per_ctn <= 0) return toast.error('Units per ctn must be greater than 0')

        setSaving(true)
        try {
            let finalPhotoUrl = formData.photo_url
            if (productFile) {
                const uploadedUrl = await uploadProductPhoto()
                if (uploadedUrl) finalPhotoUrl = uploadedUrl
            }

            const payload = {
                ...formData,
                photo_url: finalPhotoUrl
            }

            const { error } = editingProduct
                ? await updateProductAdmin(editingProduct.id, payload)
                : await createProductAdmin(payload)

            if (error) throw new Error(error)

            toast.success(editingProduct ? 'Product updated!' : 'Product added!')
            setShowModal(false)
            loadProducts()
        } catch (err: any) {
            toast.error(err.message || 'Operation failed')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product permanently?')) return
        try {
            const { error } = await deleteProductAdmin(id)
            if (error) throw new Error(error)
            toast.success('Product deleted')
            loadProducts()
        } catch (err: any) {
            toast.error('Delete failed: ' + err.message)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 32
                }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: '#111827' }}>Products</h1>
                        <p style={{ color: '#6b7280', marginTop: 4 }}>Manage inventory and pricing per carton</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => handleOpenModal()}
                            style={{
                                padding: '12px 24px',
                                background: 'var(--primary)',
                                color: '#fff',
                                borderRadius: 10,
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>+</span> Add Product
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 100 }}>
                        <div style={{
                            width: 40, height: 40,
                            border: '3px solid var(--primary-mid)',
                            borderTop: '3px solid var(--primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto'
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : products.length === 0 ? (
                    <div style={{
                        background: '#fff', borderRadius: 20, padding: 80, textAlign: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: 20 }}>🍦</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>No products found</h3>
                        <p style={{ color: '#6b7280' }}>Start adding products to populate the list</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 24
                    }}>
                        {products.map(p => {
                            const pricePerPcs = p.price_per_ctn / p.units_per_ctn
                            return (
                                <div key={p.id} style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                    border: '1px solid #f0f0f0',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{
                                        height: 200,
                                        background: '#f9fafb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        {p.photo_url ? (
                                            <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ fontSize: '3rem', opacity: 0.2 }}>📦</div>
                                        )}
                                    </div>

                                    <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>{p.name}</h3>
                                            {isAdmin && (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✏️</button>
                                                    <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit per Carton</div>
                                            <div style={{ fontWeight: 600 }}>{p.units_per_ctn} pcs / CTN</div>
                                        </div>

                                        <div style={{
                                            marginTop: 'auto',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-end',
                                            background: 'var(--primary-light)',
                                            padding: 12,
                                            borderRadius: 12
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--primary-dark)', fontWeight: 600 }}>Per Carton</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>${p.price_per_ctn.toFixed(2)}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--primary-dark)', fontWeight: 600 }}>Per Piece</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-dark)' }}>${pricePerPcs.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
                        overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontWeight: 800 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>Product Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
                                    placeholder="e.g. Vanilla Ice Cream"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>Unit per Carton</label>
                                    <input
                                        type="number"
                                        value={formData.units_per_ctn}
                                        onChange={e => setFormData({ ...formData, units_per_ctn: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>Price per CTN ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price_per_ctn}
                                        onChange={e => setFormData({ ...formData, price_per_ctn: parseFloat(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>Product Photo</label>
                                <div style={{
                                    border: '2px dashed #e5e7eb',
                                    borderRadius: 12,
                                    padding: 20,
                                    textAlign: 'center',
                                    background: '#f9fafb',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}>
                                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                    <div style={{ fontSize: '1.5rem' }}>📷</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
                                        {productFile ? productFile.name : 'Click to upload image'}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    marginTop: 8,
                                    padding: '14px',
                                    background: saving ? '#9ca3af' : 'var(--primary)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 12,
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    transition: 'transform 0.1s'
                                }}
                            >
                                {saving ? 'Processing...' : editingProduct ? 'Update Product' : 'Create Product'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
