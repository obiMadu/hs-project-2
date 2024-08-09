'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 700,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false) // State to manage edit modal
  const [itemName, setItemName] = useState('')
  const [editItemName, setEditItemName] = useState('')
  const [editItemQuantity, setEditItemQuantity] = useState('')
  const [selectedItem, setSelectedItem] = useState(null) // State to track selected item for editing
  const [searchQuery, setSearchQuery] = useState('') // State to track search query
  const [filteredInventory, setFilteredInventory] = useState([]) // State for filtered items

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleEditOpen = (item) => {
    setSelectedItem(item)
    setEditItemName(item.name)
    setEditItemQuantity(item.quantity)
    setEditOpen(true)
  }
  const handleEditClose = () => setEditOpen(false)

  // Function to update the inventory state
  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
    setFilteredInventory(inventoryList) // Initially, show all items
  }

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }
    updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }
    updateInventory()
  }

  const editItem = async (oldName, newName, newQuantity) => {
    const oldDocRef = doc(collection(firestore, 'inventory'), oldName)
    const newDocRef = doc(collection(firestore, 'inventory'), newName)

    // If the item name is changed, we need to delete the old document and create a new one
    if (oldName !== newName) {
      const oldDocSnap = await getDoc(oldDocRef)
      if (oldDocSnap.exists()) {
        await setDoc(newDocRef, { quantity: newQuantity })
        await deleteDoc(oldDocRef)
      }
    } else {
      // If the item name is the same, just update the quantity
      await setDoc(newDocRef, { quantity: newQuantity })
    }
    updateInventory()
    handleEditClose()
  }

  useEffect(() => {
    updateInventory()
  }, [])

  // Filter inventory based on search query
  useEffect(() => {
    setFilteredInventory(
      inventory.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [searchQuery, inventory])

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName)
                setItemName('')
                handleClose()
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={editOpen}
        onClose={handleEditClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Edit Item
          </Typography>
          <Stack width="100%" direction={'column'} spacing={2}>
            <TextField
              id="edit-item-name"
              label="Item Name"
              variant="outlined"
              fullWidth
              value={editItemName}
              onChange={(e) => setEditItemName(e.target.value)}
            />
            <TextField
              id="edit-item-quantity"
              label="Quantity"
              variant="outlined"
              type="number"
              fullWidth
              value={editItemQuantity}
              onChange={(e) => setEditItemQuantity(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                editItem(selectedItem.name, editItemName, editItemQuantity)
              }}
            >
              Save Changes
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>

      <TextField
        label="Search Inventory"
        variant="outlined"
        width="500px"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: '20px' }}
      />
      <Box border={'1px solid #333'} width="1024px">
        <Box
          height="100px"
          bgcolor={'#ADD8E6'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
            Inventory Items
          </Typography>
        </Box>
        <Stack spacing={2} overflow={'auto'}>
          {filteredInventory.map(({ name, quantity }) => (
            <Box
              key={name}
              width="100%"
              minHeight="100px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              paddingX={1}
            >
              <Typography variant={'h5'} color={'#333'} textAlign={'center'}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant={'h5'} color={'#333'} textAlign={'center'}>
                Quantity: {quantity}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => handleEditOpen({ name, quantity })}>
                  Edit
                </Button>
                <Button variant="contained" onClick={() => removeItem(name)}>
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
