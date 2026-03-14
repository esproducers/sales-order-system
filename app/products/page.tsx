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
import Modal from '@/components/Modal'

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
    const [showFormModal, setShowFormModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        units_per_ctn: 1,
        price_per_ctn: 0,
        photo_url: '',
    })
    const [productFile, setProductFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)

    // Delete Confirm Modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void }>({ title: '', message: '', onConfirm: () => { } })

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
        setShowFormModal(true)
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
            setShowFormModal(false)
            loadProducts()
        } catch (err: any) {
            toast.error(err.message || 'Operation failed')
        } finally {
            setSaving(false)
        }
    }

    const promptDelete = (id: string) => {
        setConfirmAction({
            title: 'Delete Product',
            message: 'Delete this product permanently? This cannot be undone.',
            onConfirm: async () => {
                try {
                    const { error } = await deleteProductAdmin(id)
                    if (error) throw new Error(error)
                    toast.success('Product deleted')
                    loadProducts()
                } catch (err: any) {
                    toast.error('Delete failed: ' + err.message)
                }
            }
        })
        setIsConfirmModalOpen(true)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold m-0 text-gray-900 leading-tight">Products</h1>
                        <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">Manage inventory and pricing per carton</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(46,189,142,0.25)] hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="text-lg leading-none">+</span> Add Product
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-20 flex-1">
                        <div className="w-10 h-10 border-4 border-primary-mid border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 md:p-20 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-50 flex flex-col items-center justify-center">
                        <div className="text-5xl md:text-6xl mb-4 md:mb-6">🍦</div>
                        <h3 className="text-xl md:text-2xl font-bold mb-2">No products found</h3>
                        <p className="text-gray-500 text-sm md:text-base">Start adding products to populate the list</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map(p => {
                            const pricePerPcs = p.price_per_ctn / p.units_per_ctn
                            return (
                                <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col hover:shadow-lg transition-shadow duration-300">
                                    <div className="h-48 md:h-52 bg-gray-50 flex items-center justify-center relative overflow-hidden group">
                                        {p.photo_url ? (
                                            <img src={p.photo_url} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="text-5xl opacity-20">📦</div>
                                        )}
                                    </div>

                                    <div className="p-4 md:p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <h3 className="m-0 text-base md:text-lg font-bold text-gray-900 leading-tight flex-1">{p.name}</h3>
                                            {isAdmin && (
                                                <div className="flex gap-2 shrink-0">
                                                    <button onClick={() => handleOpenModal(p)} className="bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors text-sm shrink-0">✏️</button>
                                                    <button onClick={() => promptDelete(p.id)} className="bg-red-50 hover:bg-red-100 w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors text-sm shrink-0">🗑️</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-[0.65rem] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Unit per Carton</div>
                                            <div className="font-semibold text-gray-700 text-sm md:text-base">{p.units_per_ctn} pcs / CTN</div>
                                        </div>

                                        <div className="mt-auto flex justify-between items-end bg-primary-light/50 p-3 md:p-4 rounded-xl border border-primary-light">
                                            <div>
                                                <div className="text-[0.65rem] md:text-xs font-bold text-primary-dark uppercase tracking-wide">Per Carton</div>
                                                <div className="text-lg md:text-xl font-black text-primary-dark leading-none mt-1">RM{p.price_per_ctn.toFixed(2)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[0.65rem] md:text-xs font-bold text-primary-dark uppercase tracking-wide">Per Piece</div>
                                                <div className="text-sm md:text-base font-bold text-primary-dark leading-none mt-1">RM{pricePerPcs.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Product Edit/Create Form Modal */}
            <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="e.g. Vanilla Ice Cream"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Unit per Carton</label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={formData.units_per_ctn}
                                onChange={e => setFormData({ ...formData, units_per_ctn: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Price per CTN (RM)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.price_per_ctn}
                                onChange={e => setFormData({ ...formData, price_per_ctn: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Product Photo</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative group">
                            <input type="file" accept="image/jpeg, image/png, image/jpg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📷</div>
                            <div className="text-xs font-semibold text-gray-500">
                                {productFile ? productFile.name : 'Click to upload image (JPG/PNG < 2MB)'}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-4 disabled:opacity-50 hover:bg-primary-dark transition-colors shadow-sm"
                    >
                        {saving ? 'Processing...' : editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                </form>
            </Modal>

            {/* Confirm Actions Modal */}
            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title={confirmAction.title}>
                <div className="space-y-6">
                    <p className="text-gray-600">{confirmAction.message}</p>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition">Cancel</button>
                        <button onClick={() => { setIsConfirmModalOpen(false); confirmAction.onConfirm(); }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition">Confirm Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
