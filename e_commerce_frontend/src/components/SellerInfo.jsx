import React, { useState } from 'react';
import '../styles/SellerInfo.css';
import { updateSellerProfile } from '../services/api';

function SellerInfo({ sellerData }) {
  const {
    shop_name: initialShopName,
    shop_description: initialShopDescription,
    user: {
      username,
      phone_number: initialPhoneNumber,
      profile_picture: initialProfilePicture,
      email: initialEmail
    }
  } = sellerData;

  const [shopName, setShopName] = useState(initialShopName);
  const [shopDescription, setShopDescription] = useState(initialShopDescription);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [email, setEmail] = useState(initialEmail);
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture);
  const [imageFile, setImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedSellerData = {
      shop_name: shopName,
      shop_description: shopDescription
    };

    const updatedUserData = {
      phone_number: phoneNumber,
      email: email
    };

    try {
      await updateSellerProfile(username, updatedSellerData, updatedUserData, imageFile);
      console.log('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }

    setIsEditing(false);
  };


  return (
    <div className="seller-info">
      <div className="seller-info__avatar">
        <img
          src={profilePicture}
          alt="Profile"
          className="seller-info__image"
        />
        {isEditing && (
          <input
            type="file"
            className="seller-info__file-input"
            accept="image/*"
            onChange={handleFileChange}
          />
        )}
      </div>
      <p className="seller-info__username">@{username}</p>

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="seller-info__input"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          <input
            type="text"
            className="seller-info__input"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <input
            type="email"
            className="seller-info__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            className="seller-info__textarea"
            value={shopDescription}
            onChange={(e) => setShopDescription(e.target.value)}
          />
          <button type="submit" className="seller-info__save-button">Save</button>
        </form>
      ) : (
        <>
          <div className="seller-info__shop-name">{shopName}</div>
          <div className="seller-info__phone">{phoneNumber || "Phone not provided"}</div>
          <div className="seller-info__email">{email || "Email not provided"}</div>
          <div className="seller-info__description">{shopDescription}</div>
          <button
            type="button"
            className="seller-info__edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}

export default SellerInfo;
