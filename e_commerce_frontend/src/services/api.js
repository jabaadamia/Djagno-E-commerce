const API_URL = 'http://localhost:8000/api';

export const getProducts = async (filters = {}) => {
  const queryParams = new URLSearchParams();

  // Add filters to query parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });
  console.log(queryParams.toString(), filters)

  const response = await fetch(`${API_URL}/products/?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

export const getProduct = async (id) => {
  const response = await fetch(`${API_URL}/products/${id}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  return response.json();
};

export const getCart = async () => {
  const response = await fetch(`${API_URL}/cart/`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }
  return response.json();
};

export const updateCartQuantity = async (productId, quantity) => {
  const response = await fetch(`${API_URL}/cart/update_quantity/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ product_id: productId, quantity })
  });

  if (!response.ok) {
    throw new Error('Failed to update cart quantity');
  }
  return response.json();
};

export const addToCart = async (productId) => {
  const response = await fetch(`${API_URL}/cart/add_to_cart/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ product_id: productId, quantity: 1 })
  });

  if (!response.ok) {
    throw new Error('Failed to add item to cart');
  }
  return response.json();
};

export const getSellerProfile = async () => {
  const response = await fetch(`${API_URL}/sellers/me/`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }
  return response.json();
};

export const updateSellerProfile = async (username, sellerData, userData, imageFile) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const sellerResponse = fetch(`${API_URL}/sellers/${username}/`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(sellerData)
  });

  let userResponse;
  if (imageFile) {
    const formData = new FormData();
    formData.append('phone_number', userData.phone_number);
    formData.append('profile_picture', imageFile);

    userResponse = fetch(`${API_URL}/users/${username}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
  } else {
    userResponse = fetch(`${API_URL}/users/${username}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(userData)
    });
  }

  const [sellerResult, userResult] = await Promise.all([sellerResponse, userResponse]);

  if (!sellerResult.ok || !userResult.ok) {
    throw new Error('Failed to update seller or user profile');
  }

  return {
    seller: await sellerResult.json(),
    user: await userResult.json()
  };
};

export const getCustomerProfile = async () => {
  const response = await fetch(`${API_URL}/customers/me/`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch customer profile');
  }
  return response.json();
};

export const updateCustomerProfile = async (username, customerData, userData, imageFile) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  //console.log(customerData);
  const customerResponse = fetch(`${API_URL}/customers/${username}/`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(customerData)
  });

  let userResponse;
  if (imageFile) {
    const formData = new FormData();
    formData.append('phone_number', userData.phone_number);
    formData.append('profile_picture', imageFile);

    userResponse = fetch(`${API_URL}/users/${username}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
  } else {
    userResponse = fetch(`${API_URL}/users/${username}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(userData)
    });
  }

  const [customerResult, userResult] = await Promise.all([customerResponse, userResponse]);

  if (!customerResult.ok || !userResult.ok) {
    throw new Error('Failed to update customer or user profile');
  }

  return {
    customer: await customerResult.json(),
    user: await userResult.json()
  };
};

export const getCategories = async () => {

  let allCategories = [];
  let nextUrl = `${API_URL}/categories/`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    allCategories = [...allCategories, ...data.results];
    nextUrl = data.next;
  }

  return { results: allCategories };
};

export const getCustomerAddresses = async (username) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/customers/${username}/addresses/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch addresses');
  }
  return response.json();
};

export const addCustomerAddress = async (username, addressData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/customers/${username}/addresses/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(addressData)
  });
  if (!response.ok) {
    throw new Error('Failed to add address');
  }
  return response.json();
};

export const updateCustomerAddress = async (username, addressId, addressData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/customers/${username}/addresses/${addressId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(addressData)
  });
  if (!response.ok) {
    throw new Error('Failed to update address');
  }
  return response.json();
};

export const deleteCustomerAddress = async (username, addressId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/customers/${username}/addresses/${addressId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete address');
  }
  return true;
};

export const createProduct = async (productData, allCategories) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');

  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('price', productData.price);
  formData.append('available_quantity', productData.available_quantity);

  productData.categories.forEach((catId) => {
    const cat = allCategories.find(c => String(c.id) === String(catId));
    if (cat) {
      formData.append('categories', cat.name);
    }
  });
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach((img) => {
      formData.append('images', img);
    });
  }

  const response = await fetch(`${API_URL}/products/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to create product');
  }
  return response.json();
};

export const getMyProducts = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');
  const response = await fetch(`${API_URL}/products/my_products/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch your products');
  }
  return response.json();
};

export const updateProduct = async (id, productData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');
  console.log(productData);
  let body, headers;
  if (productData.images && productData.images.length > 0 && productData.images[0] instanceof File) {
    // Use FormData if updating images
    body = new FormData();
    if (productData.name !== undefined) body.append('name', productData.name);
    if (productData.description !== undefined) body.append('description', productData.description);
    if (productData.price !== undefined) body.append('price', productData.price);
    if (productData.available_quantity !== undefined) body.append('available_quantity', productData.available_quantity);
    if (Array.isArray(productData.categories)) {
      productData.categories.forEach((cat) => body.append('categories', cat));
    }
    if (Array.isArray(productData.images)) {
      productData.images.forEach((img) => body.append('images', img));
    }
    headers = { 'Authorization': `Bearer ${token}` };
  } else {
    // Use JSON otherwise
    body = JSON.stringify(productData);
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  const response = await fetch(`${API_URL}/products/${id}/`, {
    method: 'PATCH',
    headers,
    body
  });
  if (!response.ok) {
    throw new Error('Failed to update product');
  }
  return response.json();
};

export const deleteProduct = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');
  const response = await fetch(`${API_URL}/products/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
  return true;
};
