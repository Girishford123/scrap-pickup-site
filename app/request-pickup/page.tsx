'use client'

import { useState } from 'react'

export default function RequestPickup() {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    preferred_date: '',
    time_window: '',
    scrap_category: '',
    description: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('✅ Request submitted successfully!')
        setFormData({
          customer_name: '',
          phone: '',
          email: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          zip: '',
          preferred_date: '',
          time_window: '',
          scrap_category: '',
          description: ''
        })
      } else {
        setMessage('❌ Error: ' + (data.error || 'Failed to submit'))
      }
    } catch (error) {
      setMessage('❌ Error submitting request')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>Request Scrap Pickup</h1>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: '1px solid',
          borderColor: message.includes('✅') ? '#c3e6cb' : '#f5c6cb',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Name *</label><br />
          <input
            type="text"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Phone *</label><br />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Email</label><br />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Street Address *</label><br />
          <input
            type="text"
            name="address1"
            value={formData.address1}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Apartment/Unit</label><br />
          <input
            type="text"
            name="address2"
            value={formData.address2}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>City *</label><br />
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>State *</label><br />
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>ZIP Code *</label><br />
          <input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Preferred Date *</label><br />
          <input
            type="date"
            name="preferred_date"
            value={formData.preferred_date}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Time Window *</label><br />
          <select
            name="time_window"
            value={formData.time_window}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">Select time window</option>
            <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
            <option value="Afternoon (12 PM - 5 PM)">Afternoon (12 PM - 5 PM)</option>
            <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
            <option value="Flexible">Flexible</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Scrap Category *</label><br />
          <select
            name="scrap_category"
            value={formData.scrap_category}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">Select category</option>
            <option value="Electronics">Electronics</option>
            <option value="Metal">Metal</option>
            <option value="Appliances">Appliances</option>
            <option value="Mixed">Mixed</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Description</label><br />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '18px',
            backgroundColor: isSubmitting ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}