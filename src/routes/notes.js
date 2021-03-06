const express = require('express')
const router = express.Router()
const { Note, Bin } = require('../models/Note')
const { noteTemplate } = require('../view-templates')

router.get('/', async (req, res) => {
	try {
		let notes
		if (req.query.search) {
			notes = await Note.find({
				$or: [
					{
						title: { $regex: req.query.search, $options: 'i' },
					},
					{
						body: { $regex: req.query.search, $options: 'i' },
					},
				],
			}).sort({ created: -1 })
			res.json(notes)
		} else if (req.query.label) {
			notes = await Note.find({ labels: req.query.label }).sort({
				created: -1,
			})
			res.json(notes)
		} else {
			notes = await Note.find({}).sort({ created: -1 })
			res.json(notes)
		}
	} catch (err) {
		console.log(err)
		res.status(500).send('Server Error')
	}
})

router.get('/:id', async (req, res) => {
	const { id } = req.params

	try {
		const note = await Note.findById(id)
		// res.json(note)
		res.send(noteTemplate(note))
	} catch (err) {
		console.log(err)
		res.status(500).send('Server Error')
	}
})

router.post('/', async (req, res) => {
	try {
		const { title, body, color, labels } = req.body

		if (title === '' || body === '') {
			res.send('Both fields cannot be empty')
		}

		const newNote = new Note({
			title,
			body,
			color: color ? color : '#ffffff',
			labels,
		})

		const createdNote = await newNote.save()

		res.json(createdNote)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server Error')
	}
})

router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params

		const note = await Note.findById(id)
		const { body, title, updated, created } = note
		if (!note) {
			res.status(404).json({ msg: 'Note Not Found' })
		} else {
			const newBinNote = new Bin({ body, title, updated, created })
			await newBinNote.save()
			await Note.findByIdAndRemove(id)

			res.json({ msg: 'Note moved to bin' })
		}
	} catch (err) {
		console.error(err)
		res.status(500).send('Server Error')
	}
})

router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { title, body, color, labels } = req.body
		const note = Note.findById(id)

		if (!note) res.status(404).json({ msg: 'Note Not Found' })

		let updatedNote = {}
		if (title) updatedNote.title = title
		if (body) updatedNote.body = body
		if (color) updatedNote.color = color
		if (labels) updatedNote.labels = labels
		updatedNote.updated = new Date()

		const updatedNoteRes = await Note.findByIdAndUpdate(
			id,
			{ $set: updatedNote },
			{ new: true }
		)

		res.json(updatedNoteRes)
	} catch (err) {
		console.error(err)
		res.status(500).send('Server Error')
	}
})

module.exports = router
