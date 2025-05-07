function updateQuantity(itemId, newQuantity) {
    fetch('/cart/update/' + itemId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update quantity');
        }
        window.location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update quantity. Please try again.');
    });
}

function removeItem(itemId) {
    if (!confirm('Are you sure you want to remove this item?')) {
        return;
    }

    fetch('/cart/remove/' + itemId, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to remove item');
        }
        window.location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to remove item. Please try again.');
    });
} 