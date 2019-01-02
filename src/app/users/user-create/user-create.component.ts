import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css']
})
export class UserCreateComponent implements OnInit {

  email = '';
  password = '';

  constructor(private usersService: UsersService) { }

  onSignUp(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.usersService.createUser(form.value.email, form.value.password);
    form.resetForm();
  }


  ngOnInit() {
  }

}
